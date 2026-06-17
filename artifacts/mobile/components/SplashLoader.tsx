import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PRIMARY = "#1A56DB";
const DOT_COUNT = 3;

function LoadingDots() {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((DOT_COUNT - i - 1) * 150),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

interface SplashLoaderProps {
  visible: boolean;
}

export function SplashLoader({ visible }: SplashLoaderProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const overlayFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.82);
      taglineFade.setValue(0);
      overlayFade.setValue(1);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(200),
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(overlayFade, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, scaleAnim, taglineFade, overlayFade]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[styles.overlay, { opacity: overlayFade }]}
    >
      <View style={styles.center}>
        {/* Logo card with subtle shadow */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../assets/images/viasetu-logo-nobg.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>
          Compare Courier Prices &amp; Book Online
        </Animated.Text>

        {/* Animated loading dots */}
        <Animated.View style={{ opacity: taglineFade }}>
          <LoadingDots />
        </Animated.View>
      </View>

      {/* Bottom branding */}
      <Animated.Text style={[styles.footerText, { opacity: taglineFade }]}>
        India's First Consumer Courier Aggregator
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 64,
    zIndex: 100,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: "#f7f9ff",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 32,
  },
  logo: {
    width: 220,
    height: 72,
  },
  tagline: {
    fontSize: 15,
    color: "#374151",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
