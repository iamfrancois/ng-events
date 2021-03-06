import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from 'src/app/core/services/event.service';
import { EventInterface } from './../../core/interfaces/event-interface';
import * as moment from 'moment'
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private pTitle = 'events'
  public subtitle = 'My awesome Angular Application'

  public events: Array<EventInterface> = new Array<EventInterface>()

  public showAll = false

  private worldClockSubscription: Subscription

  public today: moment.Moment
  public today$: any

  public constructor(
    private router: Router,
    private eventService: EventService,
    private httpClient: HttpClient) {}


  ngOnInit(): void {
    this.eventService.findAll()
      .subscribe((datas) => {
        this.events = datas
        console.log(datas)
      })
    


    // Let got an observable of the currentTime
    this.today$ = this.httpClient.get<any>(
      'http://worldclockapi.com/api/json/utc/now'
    ).pipe(
      take(1),
      map((data) => {
        return data.currentDateTime
      })
    )
  }

  ngOnDestroy() {}

  public get title(): string {
    return this.pTitle
  }

  public titleAsUpperCase(): string {
    return this.pTitle.toUpperCase()
  }

  public addEvent(): void {
    this.router.navigate(['add-event'])
  }

  public removeEvent(event: EventInterface): void {
    console.log(`Fired ${JSON.stringify(event)}`)
    this.events.splice(this.events.indexOf(event), 1)
  }

  public updateShowAll($event): void {
    this.showAll = $event
  }

  public displayedEvents(): number {
    if (this.showAll) {
      return this.events.length
    }

    return this.events.filter((event) => !this.isPast(event)).length
  }

  public isPast(event: EventInterface): boolean {
    const today: moment.Moment = moment()
    return moment(event.date).isBefore(today, 'd')
  }
}
