import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckEligibility from "./pages/CheckEligibility";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CheckEligibility />} />
      </Routes>
    </Router>
  );
}

export default App;
