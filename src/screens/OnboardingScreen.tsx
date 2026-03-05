import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useLanguage } from '../i18n';

type Props = {
  onDone: () => void;
};

export function OnboardingScreen({ onDone }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        inner: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
        title: { fontSize: 26, fontWeight: '800', color: theme.text, marginBottom: 8 },
        subtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 24 },
        card: {
          borderRadius: 16,
          padding: 18,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.borderLight,
          marginBottom: 16,
        },
        cardTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
        cardBody: { fontSize: 14, color: theme.textSecondary },
        bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
        bulletDot: { fontSize: 14, color: theme.primary, marginRight: 8, marginTop: 1 },
        bulletText: { flex: 1, fontSize: 14, color: theme.textSecondary },
        footer: { marginTop: 'auto' },
        button: {
          marginTop: 16,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          backgroundColor: theme.primary,
        },
        buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
        appName: { fontSize: 20, fontWeight: '700', color: theme.primary, marginBottom: 4 },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.appName}>ThinkLess</Text>
        <Text style={styles.title}>{t('onboardingTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboardingSubtitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('onboardingCard1Title')}</Text>
          <Text style={styles.cardBody}>{t('onboardingCard1Body')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('onboardingCard2Title')}</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{t('onboardingBullet1')}</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{t('onboardingBullet2')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('onboardingCard3Title')}</Text>
          <Text style={styles.cardBody}>{t('onboardingCard3Body')}</Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.button} onPress={onDone}>
            <Text style={styles.buttonText}>{t('onboardingStart')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

