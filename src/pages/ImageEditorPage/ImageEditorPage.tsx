import { useState } from "react";
import type { JSX } from "react";
import type {
  EditableImage,
  FileProcessingError,
} from "../../entities/image/types";
import { ImageDownloadPanel } from "../../features/image-download/ui/ImageDownloadPanel";
import { ImageStatusBar } from "../../features/image-status/ui/ImageStatusBar";
import { ImageUploadPanel } from "../../features/image-upload/ui/ImageUploadPanel";
import { ImageCanvas } from "../../features/image-viewer/ui/ImageCanvas";
import "./ImageEditorPage.css";

export function ImageEditorPage(): JSX.Element {
  const [image, setImage] = useState<EditableImage | null>(null);
  const [error, setError] = useState<FileProcessingError | null>(null);

  // Page-слой только связывает features между собой и не содержит алгоритмов обработки изображения.
  function handleImageLoaded(nextImage: EditableImage): void {
    setImage(nextImage);
    setError(null);
  }

  function handleError(nextError: FileProcessingError): void {
    setError(nextError);
  }

  return (
    <main className="image-editor">
      <header className="editor-toolbar">
        <div className="editor-title">
          <h1>Photoshop</h1>
        </div>
        <div className="toolbar-actions">
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
        <ImageCanvas imageData={image?.imageData ?? null} />
      </section>

      <ImageStatusBar metadata={image?.metadata ?? null} />
    </main>
  );
}
