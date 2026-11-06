import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { usePathname, useRouter, type Href } from 'expo-router';
import { hapticLight } from '@/lib/haptics';

/** Tab order used for horizontal paging. */
const ORDER: Href[] = ['/', '/scans', '/garden', '/library'];

const SWIPE_DISTANCE = 64;
const HORIZONTAL_SLOP = 20;
const VERTICAL_SLOP = 14;

/**
 * Horizontal swipe between the four tab pages. Vertical drags fail the gesture
 * so lists keep scrolling normally.
 */
export function SwipePager({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const pan = Gesture.Pan()
        .activeOffsetX([-HORIZONTAL_SLOP, HORIZONTAL_SLOP])
        .failOffsetY([-VERTICAL_SLOP, VERTICAL_SLOP])
        .runOnJS(true)
        .onEnd((event) => {
            if (Math.abs(event.translationX) < SWIPE_DISTANCE) return;

            const index = ORDER.indexOf(pathname as Href);
            if (index === -1) return;

            const next = event.translationX < 0 ? index + 1 : index - 1;
            if (next >= 0 && next < ORDER.length) {
                hapticLight();
                router.navigate(ORDER[next]);
            }
        });

    return (
        <GestureDetector gesture={pan}>
            <View style={styles.fill}>{children}</View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
});
