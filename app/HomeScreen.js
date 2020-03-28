import React, { useState, useEffect } from 'react';
import {
  Text,
  FlatList,
  View,
  StyleSheet,
  Button,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';

import api from './services/api';

class HomeScreen extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      hasPermission: null,
      scanned: false,
      paired: false,
      address: '',
      isPairing: false,
      isUpdatingStatus: false,
    }

  }

  componentDidMount() {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      this.setState({ hasPermission: status === 'granted' });
    })();
  }

  handleBarCodeScanned({ type, data }){
    //alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    this.setState({
      isPairing: false,
      scanned: true,
      address: data,
    });
    api.setUrl(data)
    this.updateStatus()
  };

  async handleCodeBtnPress(){
    this.setState({ isPairing: true })
  }

  async updateStatus(){
    this.setState({ isUpdatingStatus: true });
    const isConnected = await api.heartbeat();
    this.setState({ isUpdatingStatus: false, paired: isConnected });
    console.log(this.state)
  }

  renderStatus(){
    if(this.state.isUpdatingStatus){
      return (
        <ActivityIndicator size="small" color="#00ff00" />
      )
    }
    else if(this.state.paired){
      return (
        <Text style={styles.statusTextPaired}>Connected with {this.state.address}</Text>
      )
    }
    else{
      return (
        <Text style={styles.statusTextUnpaired}>Not connected!</Text>
      )
    }
  }

  render() {
    
    if (this.state.hasPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    }
    if (this.state.hasPermission === false) {
      return <Text>No access to camera</Text>;
    }

    if(this.state.isPairing){
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignContent: "center"
          }}>
    
          <Text
            style={{
              textAlign: "center",
              padding: 10
            }} >Pair your device by scanning the provided QR Code</Text>
    
          <BarCodeScanner
            onBarCodeScanned={({ type, data }) => this.handleBarCodeScanned({ type, data })}
            style={{
              width: "auto",
              height: "80%",
            }}
    
          />
        </View>
      );
    }
    
    return (
      <View style={styles.container}>

        <View style={styles.itemContainer}>
          <Text style={styles.statusTextMeta}>Current Status:</Text>
        </View>

        <View style={styles.itemContainer}>
          {this.renderStatus()}
        </View>

        <View style={styles.itemContainer}>
          <Button onPress={() => this.handleCodeBtnPress()} title="Scan QR Code" />
        </View>

        <View style={styles.itemContainer}>
          <Button onPress={() => this.updateStatus()} title="Check Connection" />
        </View>

      </View>
    );

  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    alignContent: "center",
    justifyContent: "center",
  },
  itemContainer: {
    marginVertical: 15,
  },
  statusTextMeta: {
    textAlign: "center",
  },
  statusTextUnpaired: {
    textAlign: "center",
    color: "red"
  },
  statusTextPaired: {
    textAlign: "center",
    color: "green"
  }
});

export default HomeScreen;
