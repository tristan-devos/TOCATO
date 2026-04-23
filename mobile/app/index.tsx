import { Image } from 'expo-image';
import { Sparkles, Sprout, Truck, Wrench } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1080&q=80';

const QUICK_ACTIONS = [
  { icon: Wrench, label: 'Bricolage' },
  { icon: Sparkles, label: 'Ménage' },
  { icon: Truck, label: 'Déménagement' },
  { icon: Sprout, label: 'Jardinage' },
] as const;

export default function Home() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow"
      showsVerticalScrollIndicator={false}
    >
      <View className="relative h-[520px] w-full overflow-hidden">
        <Image
          source={HERO_IMAGE}
          style={{ position: 'absolute', inset: 0 }}
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/55" />

        <SafeAreaView className="relative flex-1 px-6 pt-10 pb-8" edges={['top']}>
          <Text className="text-3xl font-bold tracking-tight text-blue-400">tocato</Text>

          <View className="mt-auto gap-4">
            <Text className="text-4xl font-extrabold leading-tight text-white">
              Trouvez la bonne personne pour tous vos projets du quotidien
            </Text>
            <Text className="text-base text-white/90">
              Des milliers de prestataires qualifiés, notés et assurés, partout en France.
            </Text>

            <Button size="lg" className="mt-2 w-full rounded-full">
              <Text>Rechercher un service</Text>
            </Button>
          </View>
        </SafeAreaView>
      </View>

      <View className="gap-4 px-6 py-8">
        <Text className="text-lg font-semibold text-foreground">Catégories populaires</Text>
        <View className="flex-row flex-wrap gap-3">
          {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
            <Pressable
              key={label}
              className="flex-1 basis-[45%] flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 active:opacity-70"
            >
              <Icon size={20} color="#2563eb" />
              <Text className="text-sm font-medium text-foreground">{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
