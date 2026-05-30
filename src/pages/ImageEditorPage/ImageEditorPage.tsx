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
import { LevelsDialog } from "../../features/image-levels/ui/LevelsDialog";
import { ImageDownloadPanel } from "../../features/image-download/ui/ImageDownloadPanel";
import { ImageStatusBar } from "../../features/image-status/ui/ImageStatusBar";
import { ImageUploadPanel } from "../../features/image-upload/ui/ImageUploadPanel";
import { ImageCanvas } from "../../features/image-viewer/ui/ImageCanvas";
import "./ImageEditorPage.css";

export function ImageEditorPage(): JSX.Element {
  const [image, setImage] = useState<EditableImage | null>(null);
  const [channels, setChannels] = useState<ChannelsState>(DEFAULT_CHANNELS_STATE);
  const [levelsPreviewImageData, setLevelsPreviewImageData] = useState<ImageData | null>(null);
  const [isLevelsDialogOpen, setIsLevelsDialogOpen] = useState<boolean>(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState<boolean>(false);
  const [colorPickerResult, setColorPickerResult] = useState<ColorPickerResult | null>(null);
  const [error, setError] = useState<FileProcessingError | null>(null);

  // Page-слой связывает features и не содержит алгоритмов обработки пикселей.
  function handleImageLoaded(nextImage: EditableImage): void {
    setImage(nextImage);
    setChannels(DEFAULT_CHANNELS_STATE);
    setLevelsPreviewImageData(null);
    setIsLevelsDialogOpen(false);
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

  const displayedImageData: ImageData | null = useMemo((): ImageData | null => {
    if (image === null) {
      return null;
    }

    const baseImageData: ImageData = levelsPreviewImageData ?? image.imageData;

    return applyChannelsToImageData(baseImageData, channels);
  }, [channels, image, levelsPreviewImageData]);

  return (
    <main className="image-editor">
      <header className="editor-toolbar">
        <div className="editor-title">
          <h1>Photoshop</h1>
        </div>
        <div className="toolbar-actions">
          <Toolbar
            canOpenLevels={image !== null}
            isColorPickerActive={isColorPickerActive}
            onColorPickerToggle={() => {
              setIsColorPickerActive((currentValue: boolean) => !currentValue);
            }}
            onLevelsOpen={() => {
              setIsLevelsDialogOpen(true);
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
            imageData={displayedImageData}
            isColorPickerActive={isColorPickerActive}
            onCanvasClick={handleCanvasPick}
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

      <ImageStatusBar metadata={image?.metadata ?? null} />

      {image !== null && isLevelsDialogOpen ? (
        <LevelsDialog
          sourceImageData={image.imageData}
          onApply={handleLevelsApply}
          onCancel={handleLevelsCancel}
          onPreviewChange={setLevelsPreviewImageData}
        />
      ) : null}
    </main>
  );
}
