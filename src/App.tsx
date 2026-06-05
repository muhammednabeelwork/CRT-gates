/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import DisplayScreen from "./components/DisplayScreen";
import ControllerDashboard from "./components/ControllerDashboard";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    const pushStateEvent = () => handleLocationChange();
    window.addEventListener("pushstate", pushStateEvent);

    if (window.location.pathname !== "/main" && window.location.pathname !== "/display") {
      window.history.replaceState({}, "", "/main");
      setCurrentPath("/main");
    }

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("pushstate", pushStateEvent);
    };
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, "", newPath);
    setCurrentPath(newPath);
  };

  if (currentPath.startsWith("/display")) {
    return <DisplayScreen />;
  }

  return <ControllerDashboard navigate={navigate} />;
}
