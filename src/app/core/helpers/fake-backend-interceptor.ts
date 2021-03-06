import { EventInterface } from './../interfaces/event-interface';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// array in local storage for registered users
let events = JSON.parse(localStorage.getItem('events')) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  constructor() {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;
        console.log(`HttpRequest was intercepted ${url}`);
        // wrap in delayed observable to simulate server api call
        return of(null)
            .pipe(mergeMap(handleRoute))
            // call materialize and dematerialize to ensure delay even if an error is thrown
            // (https://github.com/Reactive-Extensions/RxJS/issues/648)
            .pipe(materialize())
            .pipe(delay(500))
            .pipe(dematerialize());

        function handleRoute(): Observable<HttpEvent<any>> {
            const regexp: RegExp = /\/api\/v2\/events\/\d+$/
            
            switch (true) {
                case url.endsWith('/api/v2/events') && method === 'GET':
                    return getEvents();
                case url.endsWith('/api/v2/events') && method === 'POST':
                        return addEvent(request);
                case url.endsWith('/api/v2/events') && method === 'PUT':
                    return updateEvent(request);
                case regexp.test(url) && method === 'GET':
                    return getEvent();
                case regexp.test(url) && method === 'DELETE':
                    return deleteEvent();
                default:
                    // pass through any requests not handled above
                    return next.handle(request);
            }
        }

        // route functions

        function getEvents(): Observable<HttpResponse<any>> {
            return ok(events);
        }

        function deleteEvent(): Observable<HttpResponse<any>> {

            events = events.filter(x => x.id !== idFromUrl());
            localStorage.setItem('events', JSON.stringify(events));
            return ok({message: 'event was deleted'});
        }

        function getEvent(): Observable<HttpResponse<any>> {
          const event: EventInterface = events.find((obj) => obj.id = idFromUrl());
          return ok(event);
        }

        function addEvent(request: HttpRequest<any>): Observable<HttpResponse<any>> {
            const event: EventInterface = request.body
            event.id = events.length + 1
            events.push(event)
            // Update local database
            localStorage.setItem('events', JSON.stringify(events))

            // Return an observable of the brand new event
            return ok(event)
        }

        function updateEvent(request: HttpRequest<any>): Observable<HttpResponse<any>> {
            const eventIndex: number = events.findIndex((obj) => obj.id = request.body.id)
            events[eventIndex] = request.body
            return ok(request.body)
        } 
        // helper functions

        function ok(body?: any): Observable<HttpResponse<any>> {
            return of(new HttpResponse({ status: 200, body }));
        }

        function error(message): Observable<never> {
            return throwError({ error: { message } });
        }

        function unauthorized(): Observable<never> {
            return throwError({ status: 401, error: { message: 'Unauthorised' } });
        }

        function isLoggedIn(): boolean {
            return headers.get('Authorization') === 'Bearer fake-jwt-token';
        }

        function idFromUrl(): number {
            const urlParts = url.split('/');
            return +urlParts[urlParts.length - 1];
        }
    }
}

export const fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};