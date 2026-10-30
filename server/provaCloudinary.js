import dotenv from "dotenv/config";
import cloudinary from "./config/cloudinary.js";

const risultato = await cloudinary.uploader.upload(
  "https://picsum.photos/seed/prova/640/480",
  { folder: "ispezioni" },
);

console.log(risultato);
