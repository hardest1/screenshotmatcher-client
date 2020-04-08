import React from 'react';
import { Header, Title, Subtitle, Button, Left, Right, Body, Icon, Spinner, Text } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default class Head extends React.Component {

  constructor(props) {
    super(props);
  }

  renderStatusText(){
  
    if(this.props.isUpdating){
      return <Spinner color="black" />
    }
    else if(this.props.paired){
      return <Title>Connected</Title>
    }
    else{
      return <Title>Not connected!</Title>
    }

  }

  render(){
    return (
      <Header>
  
        <Body style={{ paddingLeft: 5 }}>
          { this.renderStatusText() }
        </Body>
  
        <Right>
          <Button transparent onPress={this.props.startPairing}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" />
          </Button>
          <Button transparent onPress={this.props.updateStatus}>
            <Icon name='md-refresh' />
          </Button>
        </Right>
  
      </Header>
    );
  }
}