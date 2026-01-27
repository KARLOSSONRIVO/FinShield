export function isImage(mimeType = "") {
  return mimeType.startsWith("image/");
}

export function isDocument(mimeType = "") {
  return (
    mimeType === "application/pdf" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
