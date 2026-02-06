import { useState, useCallback, useRef } from 'react';

function useHistory<T>(initialState: T) {
    const [present, setPresent] = useState<T>(initialState);
    const pastRef = useRef<T[]>([]);
    const futureRef = useRef<T[]>([]);

    const setState = useCallback((action: T | ((prev: T) => T)) => {
        setPresent(prev => {
            const newState = typeof action === 'function'
                ? (action as (prev: T) => T)(prev)
                : action;

            if (newState === prev) return prev;

            pastRef.current.push(prev);
            futureRef.current = [];

            // Limit history size
            if (pastRef.current.length > 50) {
                pastRef.current.shift();
            }

            return newState;
        });
    }, []);

    const setInternalState = useCallback((action: T | ((prev: T) => T)) => {
        setPresent(prev => {
            const newState = typeof action === 'function'
                ? (action as (prev: T) => T)(prev)
                : action;
            return newState;
        });
    }, []);

    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return;

        setPresent(prev => {
            const previous = pastRef.current.pop()!;
            futureRef.current.push(prev);
            return previous;
        });
    }, []);

    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;

        setPresent(prev => {
            const next = futureRef.current.pop()!;
            pastRef.current.push(prev);
            return next;
        });
    }, []);

    return {
        state: present,
        setState,
        setInternalState,
        undo,
        redo,
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
    };
}

export default useHistory;
