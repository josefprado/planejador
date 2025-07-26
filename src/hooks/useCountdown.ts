import { useMemo, useState, useEffect, useCallback } from 'react';

interface CountdownValues {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isFinished: boolean;
}

export const useCountdown = (targetDate: string): CountdownValues => {
    const countDownDate = useMemo(() => new Date(targetDate).getTime(), [targetDate]);
    const [countDown, setCountDown] = useState<number>(countDownDate - new Date().getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);

    const getReturnValues = useCallback((countDownValue: number): CountdownValues => {
        if (countDownValue < 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
        }
        const days = Math.floor(countDownValue / (1000 * 60 * 60 * 24));
        const hours = Math.floor((countDownValue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((countDownValue % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((countDownValue % (1000 * 60)) / 1000);
        return { days, hours, minutes, seconds, isFinished: false };
    }, []);

    return getReturnValues(countDown);
};
