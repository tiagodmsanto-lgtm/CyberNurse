import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.ops') }} />
      <View style={styles.container}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={80}
          color="#F48FB1"
        />
        <Text style={styles.title}>{t('notFound.title')}</Text>
        <Text style={styles.subtitle}>
          {t('notFound.subtitle')}
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.back')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF8F8',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  link: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E53935',
    borderRadius: 16,
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
