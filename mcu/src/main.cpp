#include <Arduino.h>

/*
    Video: https://www.youtube.com/watch?v=oCMOYS71NIU
    Based on Neil Kolban example for IDF: https://github.com/nkolban/esp32-snippets/blob/master/cpp_utils/tests/BLE%20Tests/SampleNotify.cpp
    Ported to Arduino ESP32 by Evandro Copercini
    updated by chegewara

   Create a BLE server that, once we receive a connection, will send periodic notifications.
   The service advertises itself as: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
   And has a characteristic of: beb5483e-36e1-4688-b7f5-ea07361b26a8

   The design of creating the BLE server is:
   1. Create a BLE Server
   2. Create a BLE Service
   3. Create a BLE Characteristic on the Service
   4. Create a BLE Descriptor on the characteristic
   5. Start the service.
   6. Start advertising.

   A connect hander associated with the server starts a background task that performs notification
   every couple of seconds.
*/
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
volatile unsigned long lastRotation = 0;
volatile unsigned long rotationInterval = ULONG_MAX;
volatile byte intervalSkipped = 0;
long lastCheck = 0;
long lastSerialPrint = 0;

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID "e912fa38-f062-4609-b318-9a1fcf116a16"
#define CHARACTERISTIC_UUID "20beae71-b0f1-48e4-91c4-594339b68a2b"
int ANALOG_A = GPIO_NUM_39;
int ANALOG_B = GPIO_NUM_36;
int SPEED_PIN = GPIO_NUM_21;

class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    deviceConnected = true;
    BLEDevice::startAdvertising();
  };

  void onDisconnect(BLEServer *pServer)
  {
    deviceConnected = false;
  }
};

void rotationInterrupt()
{
  unsigned long now = millis();
  unsigned long newInterval = now - lastRotation;
  if (newInterval < 6)
    return;

  lastRotation = now;

  double ratio = ((double)rotationInterval) / newInterval;
  if (rotationInterval < 1500 && ratio > 1.5 && intervalSkipped < 4)
  {
    intervalSkipped++;
    return;
  }

  intervalSkipped = 0;

  rotationInterval = newInterval;
}

void setup()
{
  Serial.begin(115200);

  pinMode(SPEED_PIN, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(SPEED_PIN), rotationInterrupt, RISING);

  // Create the BLE Device
  BLEDevice::init("Sailometer Wind");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE |
          BLECharacteristic::PROPERTY_NOTIFY |
          BLECharacteristic::PROPERTY_INDICATE);

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0); // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting a client connection to notify...");
}

String getValuesSinceLastRead()
{
  unsigned long now = millis();
  unsigned long currentInterval = std::max(now - lastRotation, (unsigned long)rotationInterval);

  String message = "";
  message.concat("a");
  message.concat("\t");
  // assume infinate interval (RPM of 0) if rotation time greater than 20 seconds
  if (currentInterval < 20000)
  {
    message.concat(currentInterval);
  }
  message.concat("\t");
  message.concat(analogRead(ANALOG_A));
  message.concat("\t");
  message.concat(analogRead(ANALOG_B));

  lastCheck = now;

  return message;
}

void loop()
{
  // notify changed value
  if (deviceConnected)
  {
    String message = getValuesSinceLastRead();
    Serial.println(message);
    pCharacteristic->setValue(message.c_str());
    pCharacteristic->notify();
    delay(50); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
  }
  else
  {
    long now = millis();
    if (now - lastSerialPrint > 200)
    {
      lastSerialPrint = now;
      Serial.println(getValuesSinceLastRead());
    }
  }

  // disconnecting
  if (!deviceConnected && oldDeviceConnected)
  {
    delay(500);                  // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("start advertising");
    oldDeviceConnected = deviceConnected;
  }

  // connecting
  if (deviceConnected && !oldDeviceConnected)
  {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
  }
}