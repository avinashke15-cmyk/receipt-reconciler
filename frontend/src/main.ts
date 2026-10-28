const url = new URL(window.location.href);
if (url.searchParams.has('utm_source')) {
  url.searchParams.delete('utm_source');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

import {bootstrapApplication} from '@angular/platform-browser';import {provideHttpClient} from '@angular/common/http';import {AppComponent} from './app.component';bootstrapApplication(AppComponent,{providers:[provideHttpClient()]}).catch(console.error);