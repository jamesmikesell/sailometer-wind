
interface WakeLockSentinel {
    addEventListener(type: 'release', callback: () => void): void;
    release(): Promise<void>;
}

interface WakeLock {
    request(type: "screen"): Promise<WakeLockSentinel>;
}

interface Navigator {
    wakeLock: WakeLock;
}
