import "bulma/css/bulma.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import HabitDetail from "./HabitDetail";
import Habits from "./Habits";
import { useSelector } from "./store";
import Login from "./Login";
import { ReactElement } from "react";

function App() {
  const loggedIn = useSelector((state) => state.login !== null);
  const element = (component: ReactElement) =>
    loggedIn ? component : <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={element(<Habits />)} />
        <Route path="/week/:week" element={element(<Habits />)} />
        <Route path="/habit/:id" element={element(<HabitDetail />)} />
      </Routes>
      <Outlet />
    </BrowserRouter>
  );
}

export default App;
