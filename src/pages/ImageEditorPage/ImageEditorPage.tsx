import { useMemo, useState } from "react";
import type { JSX } from "react";
import type {
  EditableImage,
  FileProcessingError,
  ImageFileFormat,
} from "../../entities/image/types";
import { getCanvasImageCoordinates } from "../../features/color-picker/lib/canvasCoordinates";
import { pickPixelColor } from "../../features/color-picker/lib/pickPixelColor";
import { ColorPickerInfo } from "../../features/color-picker/ui/ColorPickerInfo";
import { Toolbar } from "../../features/color-picker/ui/Toolbar";
import type {
  ColorPickerResult,
  ImageCoordinates,
} from "../../features/color-picker/types";
import { applyChannelsToImageData } from "../../features/image-channels/lib/imageChannels";
import { resolveChannelLayout } from "../../features/image-channels/model/channelLayout";
import { DEFAULT_CHANNELS_STATE } from "../../features/image-channels/model/channelState";
import type { ChannelLayout, ChannelsState } from "../../features/image-channels/types";
import { ChannelsPanel } from "../../features/image-channels/ui/ChannelsPanel";
import { FiltersDialog } from "../../features/image-filters/ui/FiltersDialog";
import { LevelsDialog } from "../../features/image-levels/ui/LevelsDialog";
import { ResizeImageDialog } from "../../features/image-resize/ui/ResizeImageDialog";
import {
  calculateFitScalePercent,
  calculateInitialDisplayScale,
  clampScalePercent,
  getZoomedScalePercent,
} from "../../features/image-scale/lib/displayScale";
import { INITIAL_SCALE_PADDING_PX } from "../../features/image-scale/model/displayScaleConstants";
import { DisplayScaleControl } from "../../features/image-scale/ui/DisplayScaleControl";
import { useImageDownload } from "../../features/image-download/hooks/useImageDownload";
import { ImageDownloadPanel } from "../../features/image-download/ui/ImageDownloadPanel";
import { ImageStatusBar } from "../../features/image-status/ui/ImageStatusBar";
import { useImageUpload } from "../../features/image-upload/hooks/useImageUpload";
import { ImageDropZone } from "../../features/image-upload/ui/ImageDropZone";
import { ImageUploadPanel } from "../../features/image-upload/ui/ImageUploadPanel";
import { ImageCanvas } from "../../features/image-viewer/ui/ImageCanvas";
import type { ImageSize } from "../../shared/types/imageSize";
import { Icon } from "../../shared/ui/Icon";
import "./ImageEditorPage.css";

type CanvasOperationScope = "levels" | "filters" | "resize";

type CanvasOperationState = Partial<Record<CanvasOperationScope, string>>;

export function ImageEditorPage(): JSX.Element {
  // Page-слой хранит состояние редактора и связывает features между собой.
  // Сами алгоритмы обработки пикселей остаются в lib-модулях конкретных features.
  const [image, setImage] = useState<EditableImage | null>(null);
  const [channels, setChannels] = useState<ChannelsState>(DEFAULT_CHANNELS_STATE);
  const [displayScalePercent, setDisplayScalePercent] = useState<number>(100);
  const [canvasViewportSize, setCanvasViewportSize] = useState<ImageSize | null>(null);
  const [levelsPreviewImageData, setLevelsPreviewImageData] = useState<ImageData | null>(null);
  const [filterPreviewImageData, setFilterPreviewImageData] = useState<ImageData | null>(null);
  const [isLevelsDialogOpen, setIsLevelsDialogOpen] = useState<boolean>(false);
  const [isResizeDialogOpen, setIsResizeDialogOpen] = useState<boolean>(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState<boolean>(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState<boolean>(false);
  const [colorPickerResult, setColorPickerResult] = useState<ColorPickerResult | null>(null);
  const [exportFormat, setExportFormat] = useState<ImageFileFormat>("png");
  const [canvasOperations, setCanvasOperations] = useState<CanvasOperationState>({});
  const [error, setError] = useState<FileProcessingError | null>(null);

  const upload = useImageUpload({
    onImageLoaded: handleImageLoaded,
    onError: handleError,
  });
  const download = useImageDownload({ onError: handleError });

  function showLoader(scope: CanvasOperationScope, label: string): void {
    setCanvasOperations((currentOperations: CanvasOperationState): CanvasOperationState => ({
      ...currentOperations,
      [scope]: label,
    }));
  }

  function hideLoader(scope: CanvasOperationScope): void {
    setCanvasOperations((currentOperations: CanvasOperationState): CanvasOperationState => {
      const nextOperations: CanvasOperationState = { ...currentOperations };
      delete nextOperations[scope];

      return nextOperations;
    });
  }

  function setOperationPending(scope: CanvasOperationScope, isPending: boolean, label: string): void {
    // Page-слой ведет несколько независимых canvas-операций, чтобы один завершившийся Worker
    // не скрывал loader другой операции, которая еще выполняется.
    if (isPending) {
      showLoader(scope, label);
      return;
    }

    hideLoader(scope);
  }

  function handleImageLoaded(nextImage: EditableImage): void {
    // При загрузке нового изображения рассчитываем стартовый scale от доступного viewport,
    // чтобы крупные файлы сразу помещались в рабочую область и не перекрывали панели.
    const initialScalePercent: number =
      canvasViewportSize === null
        ? 100
        : calculateInitialDisplayScale(nextImage.imageData, canvasViewportSize, INITIAL_SCALE_PADDING_PX);

    setImage(nextImage);
    setChannels(DEFAULT_CHANNELS_STATE);
    setDisplayScalePercent(initialScalePercent);
    setLevelsPreviewImageData(null);
    setFilterPreviewImageData(null);
    setIsLevelsDialogOpen(false);
    setIsResizeDialogOpen(false);
    setIsFiltersDialogOpen(false);
    setColorPickerResult(null);
    setCanvasOperations({});
    setError(null);
  }

  function handleError(nextError: FileProcessingError): void {
    setError(nextError);
  }

  function handleFitToViewport(): void {
    if (image === null || canvasViewportSize === null) {
      return;
    }

    setDisplayScalePercent(calculateFitScalePercent(image.imageData, canvasViewportSize, INITIAL_SCALE_PADDING_PX));
  }

  function handleZoomStep(direction: 1 | -1): void {
    setDisplayScalePercent((currentPercent: number): number => getZoomedScalePercent(currentPercent, direction));
  }

  function handleExport(): void {
    if (image === null) {
      return;
    }

    download.exportImage(image, exportFormat);
  }

  function handleLevelsCancel(): void {
    // Cancel откатывает временный preview: исходное image.imageData остается неизменным.
    setLevelsPreviewImageData(null);
    setIsLevelsDialogOpen(false);
  }

  function handleLevelsApply(nextImageData: ImageData): void {
    if (image === null) {
      return;
    }

    // Apply сохраняет результат Levels как новое основное состояние изображения.
    // Метаданные размера не меняются, потому что градационная коррекция не меняет геометрию.
    setImage({
      ...image,
      imageData: nextImageData,
    });
    setLevelsPreviewImageData(null);
    setIsLevelsDialogOpen(false);
    setColorPickerResult(null);
  }

  function handleResizeApply(nextImageData: ImageData): void {
    if (image === null) {
      return;
    }

    // После resize пересчитываем scale тем же правилом, что и при открытии файла:
    // уменьшаем, если результат не помещается в viewport, но не увеличиваем.
    const nextScalePercent: number =
      canvasViewportSize === null
        ? displayScalePercent
        : calculateInitialDisplayScale(nextImageData, canvasViewportSize, INITIAL_SCALE_PADDING_PX);

    setImage({
      ...image,
      imageData: nextImageData,
      metadata: {
        ...image.metadata,
        width: nextImageData.width,
        height: nextImageData.height,
      },
    });
    setDisplayScalePercent(nextScalePercent);
    setIsResizeDialogOpen(false);
    setColorPickerResult(null);
  }

  function handleFiltersApply(nextImageData: ImageData): void {
    if (image === null) {
      return;
    }

    // Фильтры применяются к основному imageData только после подтверждения в dialog.
    // До этого canvas получает отдельный preview через filterPreviewImageData.
    setImage({
      ...image,
      imageData: nextImageData,
    });
    setFilterPreviewImageData(null);
    setIsFiltersDialogOpen(false);
    setColorPickerResult(null);
  }

  const channelLayout: ChannelLayout | null = useMemo((): ChannelLayout | null => {
    // Набор каналов определяется форматом открытого файла и не зависит от текущих preview,
    // поэтому раскладка пересчитывается только при смене изображения.
    return image === null ? null : resolveChannelLayout(image.metadata);
  }, [image]);

  const displayedImageData: ImageData | null = useMemo((): ImageData | null => {
    // Canvas всегда получает уже готовую версию для отображения:
    // сначала активный preview фильтров, затем preview Levels, затем оригинальное imageData.
    // Каналы накладываются поверх выбранной базы и не мутируют исходные пиксели.
    if (image === null) {
      return null;
    }

    const baseImageData: ImageData = filterPreviewImageData ?? levelsPreviewImageData ?? image.imageData;

    return applyChannelsToImageData(baseImageData, channels, image.metadata.hasAlpha);
  }, [channels, filterPreviewImageData, image, levelsPreviewImageData]);
  const canvasOperationLabels: readonly string[] = Object.values(canvasOperations);
  const canvasProcessingLabel: string = canvasOperationLabels[canvasOperationLabels.length - 1] ?? "Processing image…";

  function handleCanvasPick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // Пипетка работает только в активном режиме, поэтому обычные клики по canvas
    // не создают побочных эффектов для остальных инструментов редактора.
    if (!isColorPickerActive || displayedImageData === null) {
      return;
    }

    // Координаты переводятся из CSS-пространства canvas в реальные координаты ImageData.
    // Это важно при масштабировании изображения через displayScalePercent.
    const coordinates: ImageCoordinates | null = getCanvasImageCoordinates(event, canvas);

    if (coordinates === null) {
      return;
    }

    setColorPickerResult(pickPixelColor(displayedImageData, coordinates, "displayed"));
  }

  return (
    <div className="editor" {...upload.dropZoneProps}>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="image" size={18} />
          </span>
          <span className="brand__name">Photoshop</span>
        </div>

        <div className="topbar__groups">
          <div className="toolgroup" role="group" aria-label="File">
            <ImageUploadPanel upload={upload} />
            <ImageDownloadPanel
              disabled={image === null}
              format={exportFormat}
              isExporting={download.isExporting}
              onExport={handleExport}
              onFormatChange={setExportFormat}
            />
          </div>

          <span className="topbar__divider" aria-hidden="true" />

          <Toolbar
            canPickColor={image !== null}
            canOpenLevels={image !== null}
            canOpenResize={image !== null}
            canOpenFilters={image !== null}
            isColorPickerActive={isColorPickerActive}
            onColorPickerToggle={() => {
              setIsColorPickerActive((currentValue: boolean) => !currentValue);
            }}
            onLevelsOpen={() => {
              setIsLevelsDialogOpen(true);
            }}
            onResizeOpen={() => {
              setIsResizeDialogOpen(true);
            }}
            onFiltersOpen={() => {
              setIsFiltersDialogOpen(true);
            }}
          />

          <span className="topbar__divider" aria-hidden="true" />

          <DisplayScaleControl
            disabled={image === null}
            scalePercent={displayScalePercent}
            onFitToViewport={handleFitToViewport}
            onScaleChange={(nextScalePercent: number) => {
              setDisplayScalePercent(clampScalePercent(nextScalePercent));
            }}
          />
        </div>
      </header>

      {error === null ? null : (
        <div className="banner banner--error" role="alert">
          <span className="banner__icon" aria-hidden="true">
            <Icon name="alert" />
          </span>
          <p className="banner__text">{error.message}</p>
          <code className="banner__code">{error.code}</code>
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            aria-label="Dismiss error"
            onClick={() => {
              setError(null);
            }}
          >
            <Icon name="close" />
          </button>
        </div>
      )}

      <main className="workspace" aria-label="Image workspace">
        <ImageCanvas
          displayScalePercent={displayScalePercent}
          imageData={displayedImageData}
          isColorPickerActive={isColorPickerActive}
          isProcessing={canvasOperationLabels.length > 0}
          placeholder={
            <ImageDropZone
              isDragActive={upload.isDragActive}
              isLoading={upload.isLoading}
              onOpenClick={upload.openFileDialog}
            />
          }
          processingLabel={canvasProcessingLabel}
          onCanvasClick={handleCanvasPick}
          onViewportSizeChange={setCanvasViewportSize}
          onZoomStep={handleZoomStep}
        />

        <aside className="inspector">
          <ChannelsPanel
            channels={channels}
            layout={channelLayout}
            onChannelsChange={setChannels}
            sourceImageData={image?.imageData ?? null}
          />
          <ColorPickerInfo isPickerActive={isColorPickerActive} result={colorPickerResult} />
        </aside>

        {upload.isDragActive && image !== null ? (
          <div className="drop-overlay">
            <span>Drop the file to open it</span>
          </div>
        ) : null}
      </main>

      <ImageStatusBar displayScalePercent={displayScalePercent} metadata={image?.metadata ?? null} />

      {/* Dialogs монтируются только в открытом состоянии: их preview-эффекты не должны
          считать изображение и перезаписывать canvas, пока инструмент не вызван. */}
      {image !== null && isLevelsDialogOpen ? (
        <LevelsDialog
          open
          sourceImageData={image.imageData}
          onApply={handleLevelsApply}
          onCancel={handleLevelsCancel}
          onPreviewChange={setLevelsPreviewImageData}
          onProcessingChange={(isPending: boolean) => {
            setOperationPending("levels", isPending, "Applying Levels…");
          }}
        />
      ) : null}

      {image !== null && isResizeDialogOpen ? (
        <ResizeImageDialog
          open
          sourceImageData={image.imageData}
          onApply={handleResizeApply}
          onCancel={() => {
            setIsResizeDialogOpen(false);
          }}
          onProcessingChange={(isPending: boolean) => {
            setOperationPending("resize", isPending, "Resizing image…");
          }}
        />
      ) : null}

      {image !== null && isFiltersDialogOpen ? (
        <FiltersDialog
          open
          sourceImageData={image.imageData}
          onApply={handleFiltersApply}
          onCancel={() => {
            setFilterPreviewImageData(null);
            setIsFiltersDialogOpen(false);
          }}
          onPreviewChange={setFilterPreviewImageData}
          onProcessingChange={(isPending: boolean) => {
            setOperationPending("filters", isPending, "Applying filter…");
          }}
        />
      ) : null}
    </div>
  );
}
