import { Text } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { View as RNView } from 'react-native';
import { styled } from 'nativewind';

const View = styled(RNView);

const SafeAreaView = styled(RNSafeAreaView);

export default function Library() {
    return (
        <SafeAreaView className='flex-1 gap-8 text-[#1A1C19] p-8 pb-16 font-vietnam bg-[#F4F7F2]'>
            <View className='flex gap-4'>
                <Text className='text-5xl font-jakarta-bold'>Library</Text>
            </View>
            <View className='flex-1 flex items-center justify-center gap-4'>
                <Text className='font-jakarta-bold text-2xl mx-4 text-[#1A1C19]'>
                    Coming Soon.
                </Text>
            </View>
        </SafeAreaView>
    );
}
