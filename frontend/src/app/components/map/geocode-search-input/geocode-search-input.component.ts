import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { Location } from '@rmtd/common/interfaces';
import { debounceTime, Subject, takeUntil, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'geocode-search-input',
  templateUrl: './geocode-search-input.component.html',
  styleUrls: ['./geocode-search-input.component.scss'],
})
export class GeocodeSearchInputComponent implements OnInit, OnDestroy {
  @Output('onSearchResults') onSearchResults = new EventEmitter<Location[]>();

  private readonly searchSubject = new Subject<string | undefined>();

  private destroyed$ = new Subject<void>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        takeUntil(this.destroyed$),
        debounceTime(300),
        tap(async (searchQuery) => {
          if (searchQuery) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURI(
                searchQuery
              )}.json?types=address&access_token=${environment.mapboxAccessToken}`
            );
            const json: MapboxGeocoder.Results = await response.json();
            const features = json.features as MapboxGeocoder.Result[];
            const mappedResults = this.mapSearchResults(features);
            this.onSearchResults.emit(mappedResults);
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  onSearchQueryInput(event: Event): void {
    const searchQuery = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchQuery?.trim());
  }

  private mapSearchResults(rawResults: MapboxGeocoder.Result[]): Location[] {
    return rawResults.map((result: MapboxGeocoder.Result) => {
      return {
        lng: result.center[0],
        lat: result.center[1],
        postcode: result.context.find((ctx) => ctx.id.split('.')[0] === 'postcode')?.text ?? null,
        city: result.context.find((ctx) => ctx.id.split('.')[0] === 'place')?.text ?? null,
        district: result.context.find((ctx) => ctx.id.split('.')[0] === 'district')?.text ?? null,
        state: result.context.find((ctx) => ctx.id.split('.')[0] === 'region')?.text ?? null,
        country: result.context.find((ctx) => ctx.id.split('.')[0] === 'country')?.text ?? null,
        place_name: result.place_name,
      };
    });
  }
}