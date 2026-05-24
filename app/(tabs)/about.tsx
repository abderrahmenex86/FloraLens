import { Text } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Flower2, Heart } from 'lucide-react-native';
import { View as RNView } from 'react-native';
import { styled } from 'nativewind';

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);

export default function About() {
    return (
        <SafeAreaView className='flex-1 bg-[#F4F7F2] flex justify-between p-8 pb-16'>
            <View className='flex gap-4'>
                <Text className='text-5xl font-jakarta-bold'>About</Text>
            </View>
            <View className='flex items-center justify-center gap-4'>
                <Flower2
                    size={48}
                    color='#2D5A27'
                />
                <Text className='font-jakarta-bold text-2xl mx-4 text-[#2D5A27]'>
                    FloraLens
                </Text>
                <Text className='font-vietnam text-center text-[#1A1C19]'>
                    Identify plants, prevent diseases, and manage pests easily
                    using advanced on-device AI.
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
                        {' '}
                        by humans
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
