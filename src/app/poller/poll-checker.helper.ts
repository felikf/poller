import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/expand';
import 'rxjs/add/operator/delay';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/repeat';
import 'rxjs/add/observable/timer';


export type RetrieveFunctionType = () => Observable<any>;
export type RepeatFunctionType = (any) => boolean;

export enum PollCheckerStatus {
    REACHED_MAX_ATTEMPTS = 'REACHED_MAX_ATTEMPTS',
    SUCCESS = 'SUCCESS'
}

export interface PollCheckerResult {
    status: PollCheckerStatus;
    result: any;
}

export function pollChecker(retrieveFunctionType: RetrieveFunctionType,
                            repeatFunctionType: RepeatFunctionType,
                            initialDelay: number, repeatDelay: number, max: number): Observable<PollCheckerResult> {
    let count = 0;
    let retrieve = true;

    return Observable.of('start')
        .delay(initialDelay)
        .mergeMap(() =>
            retrieveFunctionType().expand(() => {

                if (retrieve) {
                    return Observable.of(null)
                        .delay(repeatDelay)
                        .filter(() => retrieve)
                        .mergeMap(() => retrieveFunctionType());
                } else {
                    return Observable.empty();
                }
            })
        )
        .mergeMap(val => {
            count++;

            let repeat = repeatFunctionType(val);

            if (repeat  &&  count < max) {
                return Observable.empty();
            } else if (repeat  &&  count === max) {
                retrieve = false;
                return Observable.of({
                    status: PollCheckerStatus.REACHED_MAX_ATTEMPTS,
                    result: val
                });
            } else if (!repeat) {
                retrieve = false;
                return Observable.of({
                    status: PollCheckerStatus.SUCCESS,
                    result: val
                });
            }

            return Observable.throw('ERROR');
        });
}

