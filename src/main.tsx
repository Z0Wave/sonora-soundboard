

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./assets/styles/global.css";

// 1. Bloqueia o clique com o botão direito (Menu de contexto do navegador)
document.addEventListener("contextmenu", (e) => e.preventDefault());

// 2. Bloqueia atalhos de teclado de navegadores web
// document.addEventListener("keydown", (e) => {
//   // Bloqueia F12 (Inspecionar Elemento)
//   if (e.key === "F12") e.preventDefault();
  
//   // Bloqueia F5 e Ctrl + R (Recarregar a página e perder os estados)
//   if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
//     e.preventDefault();
//   }
  
//   // Bloqueia Ctrl + Shift + I e Ctrl + Shift + J (DevTools)
//   if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "j")) {
//     e.preventDefault();
//   }
// });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);