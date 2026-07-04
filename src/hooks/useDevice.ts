"use client";

import { useEffect, useState } from "react";

export function useDevice() {

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {

        const check = () => {

            const mobile =
                /Android|iPhone|iPad|iPod/i.test(
                    navigator.userAgent
                );

            setIsMobile(mobile);
        };

        check();

        window.addEventListener("resize", check);

        return () =>
            window.removeEventListener("resize", check);

    }, []);

    return {
        isMobile,
    };
}