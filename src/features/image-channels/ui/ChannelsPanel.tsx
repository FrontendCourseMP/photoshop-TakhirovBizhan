import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { OperationLoader } from "../../../shared/ui/OperationLoader/OperationLoader";
import { createChannelPreviewsInWorker } from "../../image-processing-worker/workerClient";
import { CHANNEL_PREVIEW_MAX_SIDE } from "../model/previewSize";
import type {
  ChannelPreview as ChannelPreviewData,
  ChannelsState,
  ColorChannel,
} from "../types";
import { ChannelPreview } from "./ChannelPreview";

interface ChannelsPanelProps {
  readonly sourceImageData: ImageData | null;
  readonly channels: ChannelsState;
  readonly onChannelsChange: (channels: ChannelsState) => void;
}

interface ChannelPreviewsState {
  readonly sourceImageData: ImageData | null;
  readonly previews: readonly ChannelPreviewData[];
}

const channelLabels: Readonly<Record<ColorChannel, string>> = {
  red: "Red",
  green: "Green",
  blue: "Blue",
  alpha: "Alpha",
};

export function ChannelsPanel({
  sourceImageData,
  channels,
  onChannelsChange,
}: ChannelsPanelProps): JSX.Element {
  const [previewsState, setPreviewsState] = useState<ChannelPreviewsState>({
    sourceImageData: null,
    previews: [],
  });
  const previewTaskIdRef = useRef<number>(0);
  const previews: readonly ChannelPreviewData[] =
    previewsState.sourceImageData === sourceImageData ? previewsState.previews : [];
  const isPreviewsPending: boolean = sourceImageData !== null && previewsState.sourceImageData !== sourceImageData;

  useEffect((): (() => void) | void => {
    if (sourceImageData === null) {
      previewTaskIdRef.current += 1;
      return undefined;
    }

    const taskId: number = previewTaskIdRef.current + 1;
    previewTaskIdRef.current = taskId;

    // Превью строятся из sourceImageData, а не из текущего displayedImageData.
    // Разбор на каналы идет в Worker и ограничен размером миниатюры.
    void createChannelPreviewsInWorker(sourceImageData, CHANNEL_PREVIEW_MAX_SIDE)
      .then((nextPreviews: readonly ChannelPreviewData[]): void => {
        if (previewTaskIdRef.current === taskId) {
          setPreviewsState({
            sourceImageData,
            previews: nextPreviews,
          });
        }
      })
      .catch((): void => {
        if (previewTaskIdRef.current === taskId) {
          setPreviewsState({
            sourceImageData,
            previews: [],
          });
        }
      });

    return (): void => {
      previewTaskIdRef.current += 1;
    };
  }, [sourceImageData]);

  function handleToggle(channel: ColorChannel): void {
    // Состояние каналов иммутабельно пересобирается на page-уровне:
    // сама панель не применяет пиксельные изменения к изображению.
    onChannelsChange({
      ...channels,
      [channel]: !channels[channel],
    });
  }

  return (
    <section className="panel panel--stretch" aria-label="Image channels">
      <header className="panel__header">
        <h2>Channels</h2>
        <span className="panel__hint">Visible in the canvas</span>
      </header>

      <div className="channel-toggles" role="group" aria-label="Channel visibility">
        {(Object.keys(channelLabels) as readonly ColorChannel[]).map((channel: ColorChannel) => (
          <label
            className={channels[channel] ? "channel-toggle" : "channel-toggle channel-toggle--off"}
            key={channel}
          >
            <input
              type="checkbox"
              checked={channels[channel]}
              disabled={sourceImageData === null}
              onChange={() => {
                handleToggle(channel);
              }}
            />
            <span className={`channel-toggle__dot channel-toggle__dot--${channel}`} aria-hidden="true" />
            <span className="channel-toggle__label">{channelLabels[channel]}</span>
          </label>
        ))}
      </div>

      <div className="channel-previews">
        <OperationLoader active={isPreviewsPending} label="Building channel previews…" />
        {previews.length === 0 ? (
          <p className="panel__empty">
            {sourceImageData === null ? "Open an image to inspect its channels" : "Preparing previews…"}
          </p>
        ) : (
          previews.map((preview: ChannelPreviewData) => (
            <ChannelPreview
              imageData={preview.imageData}
              isInactive={
                preview.controlledChannel !== undefined &&
                !channels[preview.controlledChannel]
              }
              key={preview.kind}
              title={preview.title}
            />
          ))
        )}
      </div>
    </section>
  );
}
