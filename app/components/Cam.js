import React from 'react';
import { StyleSheet } from 'react-native';
import { Header, Title, Subtitle, Button, Left, Right, Body, Content, Icon, Spinner, Text } from 'native-base';

import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

export default class Cam extends React.Component {

  constructor(props) {
    super(props);
  }

  render(){
    return (
      <Content padded contentContainerStyle={{ flex: 1 }}>
        
        <Camera 
          style={{ flex: 1 }} 
          type={Camera.Constants.Type.back}
          ref={ref => { 
            this.camera = ref;
            this.props.initCamera(this.camera);
          }}
          />

        {this.props.isPhotoLoading ? (
          <Button full large disabled>
            <Text>{this.props.loadingMsg}</Text>
          </Button>
        ) : (
          <Button full large onPress={() => this.props.handlePictureBtnPress()} >
            <Icon name='md-camera' />
          </Button>
        )}
            

      </Content>
    );
  }
}