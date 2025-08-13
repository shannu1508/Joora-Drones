import React, {Suspense} from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { createHashRouter, RouterProvider } from "react-router-dom";
import ContactForm from "./pages/Contact/ContactForm.jsx";
import ShpToKml from "./pages/ShptoKml/ShpToKml.jsx";

const LazyMainLayout = React.lazy(() => import("./pages/Services/MainLayout/MainLayout.jsx"));

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/ContactForm",
    element: <ContactForm />,
  },
  {
    path: "/land_surveying",
    element: 
    <Suspense fallback={<div className="loader"></div>}>
      <LazyMainLayout service={"land_surveying"} />
    </Suspense>,
  },
  {
    path: "/mapping",
    element: 
    <Suspense fallback={<div className="loader"></div>}>
      <LazyMainLayout service={"mapping"} />
    </Suspense>,
  },
  {
    path: "/inspection",
    element: 
    <Suspense fallback={<div className="loader"></div>}>
      <LazyMainLayout service={"inspection"} />
    </Suspense>,
  },
  {
    path: "/photography",
    element: <Suspense fallback={<div className="loader"></div>}>
    <LazyMainLayout service={"photography"} />
  </Suspense>,
  },
  {
    path: "/shptokml",
    element: <Suspense fallback={<div className="loader"></div>}>
      <ShpToKml />
    </Suspense>
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
