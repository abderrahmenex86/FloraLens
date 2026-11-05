import { Text, View as RNView } from 'react-native';
import {
    SafeAreaView as RNSafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Flower2, Heart } from 'lucide-react-native';
import { styled } from 'nativewind';
import { colors } from '@/theme';

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);

export default function About() {
    const insets = useSafeAreaInsets();
    return (
        <SafeAreaView
            className='flex-1 bg-[#F4F7F2] flex justify-between p-8'
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 88 }}>
            <View className='flex gap-4'>
                <Text className='text-5xl font-jakarta-bold'>About</Text>
            </View>
            <View className='flex items-center justify-center gap-4'>
                <Flower2
                    size={48}
                    color={colors.primary}
                />
                <Text className='font-jakarta-bold text-2xl mx-4 text-[#2D5A27]'>
                    FloraLens
                </Text>
                <Text className='font-vietnam text-center text-[#1A1C19]'>
                    Identify plants, spot pests, and understand plant health
                    with on-device AI.
                </Text>
                <Text className='font-vietnam text-center text-[#1A1C19]/60 text-sm'>
                    Photos and scans stay on your phone. No account, no uploads.
                </Text>
            </View>
            <View className='font-vietnam p-6 pb-8 items-center'>
                <View className='flex flex-row gap-1 items-center justify-center'>
                    <Text className='font-vietnam-bold  text-[#1A1C19]'>
                        Made with{' '}
                    </Text>
                    <Heart
                        size={16}
                        color='red'
                        fill='red'
                    />
                    <Text className='font-vietnam-bold text-[#1A1C19]'>
                        by humans.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
