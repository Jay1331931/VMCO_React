import { Capacitor } from '@capacitor/core';

function usePlatform() {
    return Capacitor.isNativePlatform();
    // return true;
}

export default usePlatform;