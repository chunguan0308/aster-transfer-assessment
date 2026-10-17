import { ScrollView, View } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text } from 'react-native-paper';
import { simulationOptions, type Simulation } from '@/features/transfers/constants/simulation';
import { styles } from './DemoSettings.styles';

export function DemoSettings({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: Simulation;
  onChange: (value: Simulation) => void;
  onClose: () => void;
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        <Dialog.Title>Demo settings</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            Explore how Aster handles transfer outcomes. Device authorization is always required.
            Settings reset when the app restarts.
          </Text>
        </Dialog.Content>
        <Dialog.ScrollArea>
          <ScrollView style={styles.scroll}>
            <RadioButton.Group
              value={value}
              onValueChange={(next) => {
                const option = simulationOptions.find((item) => item.value === next);
                if (option) onChange(option.value);
              }}
            >
              {simulationOptions.map((option) => (
                <View key={option.value} style={styles.option}>
                  <RadioButton.Item label={option.title} value={option.value} />
                  <Text variant="bodySmall" style={styles.description}>
                    {option.description}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onClose}>Done</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
