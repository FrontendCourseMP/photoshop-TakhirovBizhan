import { useMemo, useState } from "react";
import type { JSX } from "react";
import type {
  EditableImage,
  FileProcessingError,
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
import { DEFAULT_CHANNELS_STATE } from "../../features/image-channels/model/channelState";
import type { ChannelsState } from "../../features/image-channels/types";
import { ChannelsPanel } from "../../features/image-channels/ui/ChannelsPanel";
import { FiltersDialog } from "../../features/image-filters/ui/FiltersDialog";
import { LevelsDialog } from "../../features/image-levels/ui/LevelsDialog";
import { ResizeImageDialog } from "../../features/image-resize/ui/ResizeImageDialog";
import { calculateInitialDisplayScale, clampScalePercent } from "../../features/image-scale/lib/displayScale";
import { INITIAL_SCALE_PADDING_PX } from "../../features/image-scale/model/displayScaleConstants";
import { DisplayScaleControl } from "../../features/image-scale/ui/DisplayScaleControl";
import { ImageDownloadPanel } from "../../features/image-download/ui/ImageDownloadPanel";
import { ImageStatusBar } from "../../features/image-status/ui/ImageStatusBar";
import { ImageUploadPanel } from "../../features/image-upload/ui/ImageUploadPanel";
import { ImageCanvas } from "../../features/image-viewer/ui/ImageCanvas";
import type { ImageSize } from "../../shared/types/imageSize";
import "./ImageEditorPage.css";

export function ImageEditorPage(): JSX.Element {
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
  const [error, setError] = useState<FileProcessingError | null>(null);

  // Page-слой связывает features и не содержит алгоритмов обработки пикселей.
  function handleImageLoaded(nextImage: EditableImage): void {
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
    setError(null);
  }

  function handleError(nextError: FileProcessingError): void {
    setError(nextError);
  }

  function handleCanvasPick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!isColorPickerActive || image === null) {
      return;
    }

    const coordinates: ImageCoordinates | null = getCanvasImageCoordinates(event, canvas);

    if (coordinates === null) {
      return;
    }

    setColorPickerResult(pickPixelColor(image.imageData, coordinates));
  }

  function handleLevelsCancel(): void {
    setLevelsPreviewImageData(null);
    setIsLevelsDialogOpen(false);
  }

  function handleLevelsApply(nextImageData: ImageData): void {
    if (image === null) {
      return;
    }

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

    setImage({
      ...image,
      imageData: nextImageData,
    });
    setFilterPreviewImageData(null);
    setIsFiltersDialogOpen(false);
    setColorPickerResult(null);
  }

  const displayedImageData: ImageData | null = useMemo((): ImageData | null => {
    if (image === null) {
      return null;
    }

    const baseImageData: ImageData = filterPreviewImageData ?? levelsPreviewImageData ?? image.imageData;

    return applyChannelsToImageData(baseImageData, channels);
  }, [channels, filterPreviewImageData, image, levelsPreviewImageData]);

  return (
    <main className="image-editor">
      <header className="editor-toolbar">
        <div className="editor-title">
          <h1>Photoshop</h1>
        </div>
        <div className="toolbar-actions">
          <Toolbar
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
          <DisplayScaleControl
            disabled={image === null}
            scalePercent={displayScalePercent}
            onScaleChange={(nextScalePercent: number) => {
              setDisplayScalePercent(clampScalePercent(nextScalePercent));
            }}
          />
          <ImageUploadPanel
            onImageLoaded={handleImageLoaded}
            onError={handleError}
          />
          <ImageDownloadPanel image={image} onError={handleError} />
        </div>
      </header>

      {error === null ? null : (
        <div className="error-banner" role="alert">
          <strong>{error.code}</strong>
          <span>{error.message}</span>
        </div>
      )}

      <section className="editor-workspace" aria-label="Image workspace">
        <div className="workspace-layout">
          <ImageCanvas
            displayScalePercent={displayScalePercent}
            imageData={displayedImageData}
            isColorPickerActive={isColorPickerActive}
            onCanvasClick={handleCanvasPick}
            onViewportSizeChange={setCanvasViewportSize}
          />
          <div className="inspector-panel">
            <ChannelsPanel
              channels={channels}
              onChannelsChange={setChannels}
              sourceImageData={image?.imageData ?? null}
            />
            <ColorPickerInfo result={colorPickerResult} />
          </div>
        </div>
      </section>

      <ImageStatusBar displayScalePercent={displayScalePercent} metadata={image?.metadata ?? null} />

      {image !== null && isLevelsDialogOpen ? (
        <LevelsDialog
          sourceImageData={image.imageData}
          onApply={handleLevelsApply}
          onCancel={handleLevelsCancel}
          onPreviewChange={setLevelsPreviewImageData}
        />
      ) : null}

      {image !== null ? (
        <ResizeImageDialog
          open={isResizeDialogOpen}
          sourceImageData={image.imageData}
          onApply={handleResizeApply}
          onCancel={() => {
            setIsResizeDialogOpen(false);
          }}
        />
      ) : null}

      {image !== null ? (
        <FiltersDialog
          open={isFiltersDialogOpen}
          sourceImageData={image.imageData}
          onApply={handleFiltersApply}
          onCancel={() => {
            setFilterPreviewImageData(null);
            setIsFiltersDialogOpen(false);
          }}
          onPreviewChange={setFilterPreviewImageData}
        />
      ) : null}
    </main>
  );
}
