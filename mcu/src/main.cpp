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
volatile int rotationsSinceLastCheck = 0;
volatile long lastTrigger = 0;
long lastCheck = 0;
double aMax = 2600;
double aMin = 1280;
double bMax = aMax;
double bMin = aMin;
long lastSerialPrint = 0;

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

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

void rotation_interrupt()
{
  long now = millis();
  if ((now - lastTrigger) < 6)
    return;

  lastTrigger = now;
  rotationsSinceLastCheck++;
}

void setup()
{
  Serial.begin(115200);

  int speedPin = 21;
  pinMode(speedPin, INPUT_PULLDOWN);
  attachInterrupt(speedPin, rotation_interrupt, RISING);

  // Create the BLE Device
  BLEDevice::init("ESP32");

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

int degree(double a, double b)
{
  // aMax = std::max(a, aMax);
  // bMax = std::max(a, bMax);
  // aMin = std::min(a, aMin);
  // bMin = std::min(a, bMin);

  int aMid = (aMax + aMin) / 2;
  int bMid = (bMax + bMin) / 2;
  int aAmplitude = aMax - aMid;
  int bAmplitude = bMax - bMid;

  a = (a - aMid) / aAmplitude;
  b = (b - bMid) / bAmplitude;

  double radians = atan(a / b) / PI;

  double angle;
  // Quadrants
  // 4 1
  // 3 2
  if (b >= 0)
  {
    //quad 1 or 4
    if (a >= 0)
    {
      //quad 1
      angle = radians;
    }
    else
    {
      //quad 4
      angle = 2 + radians;
    }
  }
  else
  {
    //quad 2 or 3
    angle = 1 + radians;
  }

  return (int)(angle * 100 / 2);
}

String getValuesSinceLastRead()
{
  long now = millis();
  int count = rotationsSinceLastCheck;
  rotationsSinceLastCheck = 0;

  String message = "";
  message.concat("a");
  message.concat("\t");
  message.concat(count);
  message.concat("\t");
  message.concat(now - lastCheck);
  message.concat("\t");
  message.concat(degree(analogRead(39), analogRead(36)));

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
    delay(200); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
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