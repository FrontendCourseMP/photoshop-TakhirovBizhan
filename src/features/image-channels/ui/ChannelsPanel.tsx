import { useMemo } from "react";
import type { JSX } from "react";
import { createChannelPreviews } from "../lib/imageChannels";
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
  const previews: readonly ChannelPreviewData[] =
    useMemo((): readonly ChannelPreviewData[] => {
      // Превью строятся из sourceImageData, а не из текущего displayedImageData.
      // Поэтому миниатюры всегда показывают исходное содержимое каналов без накопления эффектов.
      return sourceImageData === null
        ? []
        : createChannelPreviews(sourceImageData);
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
    <aside className="channels-panel" aria-label="Image channels">
      <div className="panel-heading">
        <h2>Channels</h2>
      </div>

      <div className="channel-controls" aria-label="Channel switches">
        {(Object.keys(channelLabels) as readonly ColorChannel[]).map(
          (channel: ColorChannel) => (
            <label
              className={
                channels[channel]
                  ? "channel-toggle"
                  : "channel-toggle channel-toggle--inactive"
              }
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
              <span>{channelLabels[channel]}</span>
            </label>
          )
        )}
      </div>

      <div className="channel-preview-list">
        {previews.length === 0 ? (
          <div className="panel-empty">Open an image to inspect channels</div>
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
    </aside>
  );
}
