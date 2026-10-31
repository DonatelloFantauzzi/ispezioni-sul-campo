export default async function ridimensionaFoto(file) {
  // 1. leggere
  const immagine = await createImageBitmap(file);
  // 2. misurare
  const latoLungo = Math.max(immagine.width, immagine.height);
  const scala = Math.min(1, 1600 / latoLungo);
  const nuovaLarghezza = Math.round(immagine.width * scala);
  const nuovaAltezza = Math.round(immagine.height * scala);
  // 3. ridisegnare
  const tela = new OffscreenCanvas(nuovaLarghezza, nuovaAltezza);
  const pennello = tela.getContext("2d");
  pennello.drawImage(immagine, 0, 0, nuovaLarghezza, nuovaAltezza);
  immagine.close();
  // 4. salvare e restituire il Blob
  const blob = await tela.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  return blob;
}
