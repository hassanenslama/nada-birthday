import React, { createContext, useContext, useState } from 'react';

const ImmersiveModeContext = createContext();

export const useImmersiveMode = () => useContext(ImmersiveModeContext);

export const ImmersiveModeProvider = ({ children }) => {
    const [isImmersive, setIsImmersive] = useState(false);

    return (
        <ImmersiveModeContext.Provider value={{ isImmersive, setIsImmersive }}>
            {children}
        </ImmersiveModeContext.Provider>
    );
};
