import React, { useState } from 'react';
import Teaser from './components/Teaser';

import { TARGET_DATE } from './config';

function App() {
  // Logic: Check if NOW is past TARGET
  const [isUnlocked, setIsUnlocked] = useState(new Date() > TARGET_DATE);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return <Teaser onUnlock={handleUnlock} />;
  }

  return (
    <div className="bg-charcoal min-h-screen text-rosegold flex items-center justify-center">
      <h1 className="text-4xl">🎉 Happy Birthday Nada! The App Starts Here. 🎉</h1>
      {/* We will build the rest of the app here later */}
    </div>
  );
}

export default App;
