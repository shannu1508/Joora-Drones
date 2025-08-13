import "./App.css";
import { Navbar, Home, About, Services, Clients, Stats, Contact, MainSlider } from "./pages";
import ShpToKml from "./pages/ShptoKml/ShpToKml";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home />
              <MainSlider />
              <About />
              <Stats />
              <Services />
              <Clients />
              <Contact />
            </>
          }
        />
        <Route path="/shptokml" element={<ShpToKml />} />
        {/* other routes */}
      </Routes>
    </>
  );
}

export default App;
