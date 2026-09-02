import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { OperationLoader } from '../../../shared/ui/OperationLoader/OperationLoader'
import { createChannelPreviewsInWorker } from '../../image-processing-worker/workerClient'
import { DEFAULT_CHANNELS_STATE } from '../model/channelState'
import { CHANNEL_PREVIEW_MAX_SIDE } from '../model/previewSize'
import type {
  ChannelLayout,
  ChannelPreviewImage,
  ChannelPreviewKind,
  ChannelSlot,
  ChannelsState,
  ColorChannel,
} from '../types'
import { ChannelTile } from './ChannelTile'

interface ChannelsPanelProps {
  readonly sourceImageData: ImageData | null
  readonly layout: ChannelLayout | null
  readonly channels: ChannelsState
  readonly onChannelsChange: (channels: ChannelsState) => void
}

interface ChannelPreviewsState {
  readonly sourceImageData: ImageData | null
  readonly previews: readonly ChannelPreviewImage[]
}

export function ChannelsPanel({
  sourceImageData,
  layout,
  channels,
  onChannelsChange,
}: ChannelsPanelProps): JSX.Element {
  const [previewsState, setPreviewsState] = useState<ChannelPreviewsState>({
    sourceImageData: null,
    previews: [],
  })
  const previewTaskIdRef = useRef<number>(0)
  const previewKinds: readonly ChannelPreviewKind[] = useMemo((): readonly ChannelPreviewKind[] => {
    return layout === null ? [] : layout.slots.map((slot: ChannelSlot): ChannelPreviewKind => slot.kind)
  }, [layout])
  // Пока Worker считает миниатюры для нового файла, показывать превью прошлого изображения нельзя:
  // они относятся к другим пикселям и к другой раскладке каналов.
  const isPreviewsReady: boolean = previewsState.sourceImageData === sourceImageData
  const previews: readonly ChannelPreviewImage[] = isPreviewsReady ? previewsState.previews : []
  const isPreviewsPending: boolean = sourceImageData !== null && !isPreviewsReady

  useEffect((): (() => void) | void => {
    if (sourceImageData === null || previewKinds.length === 0) {
      previewTaskIdRef.current += 1
      return undefined
    }

    const taskId: number = previewTaskIdRef.current + 1
    previewTaskIdRef.current = taskId

    // Каналы разбираются из sourceImageData, а не из уже отфильтрованной картинки на главном canvas,
    // иначе выключенный канал давал бы черную миниатюру и его нельзя было бы вернуть осознанно.
    // Сам разбор идет в Worker и ограничен размером миниатюры.
    void createChannelPreviewsInWorker(sourceImageData, CHANNEL_PREVIEW_MAX_SIDE, previewKinds)
      .then((nextPreviews: readonly ChannelPreviewImage[]): void => {
        if (previewTaskIdRef.current === taskId) {
          setPreviewsState({ sourceImageData, previews: nextPreviews })
        }
      })
      .catch((): void => {
        if (previewTaskIdRef.current === taskId) {
          setPreviewsState({ sourceImageData, previews: [] })
        }
      })

    return (): void => {
      previewTaskIdRef.current += 1
    }
  }, [previewKinds, sourceImageData])

  function isSlotVisible(slot: ChannelSlot): boolean {
    // Плитка яркости отвечает сразу за три компонента, поэтому включенной она считается
    // только при видимости всех связанных каналов.
    return slot.linkedChannels.every((channel: ColorChannel): boolean => channels[channel])
  }

  function handleSlotToggle(slot: ChannelSlot): void {
    const nextValue: boolean = !isSlotVisible(slot)
    const nextChannels: Record<ColorChannel, boolean> = { ...channels }

    for (const channel of slot.linkedChannels) {
      nextChannels[channel] = nextValue
    }

    // Состояние каналов иммутабельно пересобирается на page-уровне:
    // сама панель не применяет пиксельные изменения к изображению.
    onChannelsChange(nextChannels)
  }

  const hiddenSlotCount: number =
    layout === null ? 0 : layout.slots.filter((slot: ChannelSlot): boolean => !isSlotVisible(slot)).length

  return (
    <section className="panel panel--stretch" aria-label="Image channels">
      <header className="panel__header">
        <h2>Channels</h2>
        <div className="channel-head">
          {layout === null ? null : <span className="badge">{`${layout.title} · ${layout.slots.length}`}</span>}
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            disabled={hiddenSlotCount === 0}
            title="Show every channel"
            aria-label="Show every channel"
            onClick={() => {
              onChannelsChange(DEFAULT_CHANNELS_STATE)
            }}
          >
            <Icon name="reset" />
          </button>
        </div>
      </header>

      <div className="channel-grid">
        <OperationLoader active={isPreviewsPending} label="Building channel previews…" />
        {layout === null || previews.length === 0 ? (
          <p className="panel__empty">
            {sourceImageData === null ? 'Open an image to inspect its channels' : 'Preparing previews…'}
          </p>
        ) : (
          layout.slots.map((slot: ChannelSlot) => {
            const preview: ChannelPreviewImage | undefined = previews.find(
              (item: ChannelPreviewImage): boolean => item.kind === slot.kind,
            )

            if (preview === undefined) {
              return null
            }

            return (
              <ChannelTile
                imageData={preview.imageData}
                isVisible={isSlotVisible(slot)}
                key={slot.kind}
                kind={slot.kind}
                label={slot.label}
                onToggle={() => {
                  handleSlotToggle(slot)
                }}
              />
            )
          })
        )}
      </div>

      {layout === null ? null : (
        <p className="channel-note">
          Thumbnails show one channel each: white is full intensity, black is none. Click a tile to hide its
          contribution on the canvas.
        </p>
      )}
    </section>
  )
}
