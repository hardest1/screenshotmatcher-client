

class Api {

  baseUrl = ''
  
  constructor() {
    if (Api.instance) {
      return Api.instance;
    }
    Api.instance = this;
  }
  
  setUrl(url){
    this.baseUrl = url;
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

  heartbeat(){
    if(!this.baseUrl) return false;

    return this.call('/heartbeat')
      .then(response => { return (response === 'ok'); })
      .catch(error => { console.log('Error with Heartbeat. Is the server online?'); });
  }

}

export default new Api();