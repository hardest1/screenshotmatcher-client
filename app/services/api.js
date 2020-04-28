import { AsyncStorage } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { Linking } from "expo";


class Api {
  
  constructor() {
    if (Api.instance) {
      return Api.instance;
    }
    Api.instance = this;
  }

  async init(){
    try {
      const addr = await AsyncStorage.getItem('apiAddress');
      if (addr !== null) { 
        await this.setUrl(addr)
        return addr
      }
    } catch (error) {
      console.error(error)
    }
    return false
  }
  
  async setUrl(url){
    this.baseUrl = url;
    try {
      await AsyncStorage.setItem('apiAddress', this.baseUrl);
    } catch (error) {
      console.error(error)
    }
  }

  handleResponse(response) {
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1)
        return response.json();
      return response.text();
    }
    throw response;
  }
  
  handleError(response) {
    console.log(
      'API error:',
      response.status,
      response.statusText,
      response.url
    );
    throw new Error(response.status);
  }

  call(endpoint){
    return fetch(this.baseUrl + endpoint)
      .then(this.handleResponse)
      .catch(this.handleError);
  }

  callPOST(endpoint, data){
    return fetch(this.baseUrl + endpoint, {
      method: 'POST',
      body: data
    })
      .then(this.handleResponse)
      .catch(this.handleError);
  }

  heartbeat(){
    if(!this.baseUrl) return false;

    return this.call('/heartbeat')
      .then(response => { return (response === 'ok'); })
      .catch(error => { console.log('Error with Heartbeat. Is the server online?'); });
  }

  postImage(picture){
    if(!this.baseUrl) return false;

    const body = new FormData()

    body.append('image_file', {
      uri: picture.uri,
      type: 'image/jpeg',
      name: 'image_file'
    })

    return this.callPOST('/match', body)
      .then(response => response)
      .catch(error => { console.log('Error with Posting. Is the server online?'); });
  }

  async downloadFile(url){
    if(!this.baseUrl) return false;

    const uri = this.baseUrl + url;

    var filename = url.split("/").pop();

    let fileUri = FileSystem.documentDirectory + filename;

    const result = await FileSystem.downloadAsync(uri, fileUri)

    return result && result.uri
  }

  async saveFile(fileUri){
    const asset = await MediaLibrary.createAssetAsync(fileUri)
    const album = await MediaLibrary.createAlbumAsync("ScreenshotMatcher", asset, false)
    return asset.uri
  }

}

export default new Api();