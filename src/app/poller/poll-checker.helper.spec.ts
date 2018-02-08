import { Observable } from 'rxjs/Observable';
import { pollChecker, PollCheckerResult, PollCheckerStatus } from './poll-checker.helper';
import { cold } from 'jasmine-marbles';
// import { cold } from 'jasmine-marbles';

class PollTest {
    protected retrieveRepeat = 0;
    protected finish: number;

    constructor(finish: number) {
        this.finish = finish;
    }

    retrieveFunctionType(): Observable<any> {
        console.log(`retrieveFunctionType  ${this.retrieveRepeat}`, ', arguments: ' , arguments);
        this.retrieveRepeat++;
        return Observable.of(this.retrieveRepeat < this.finish ? 'continue' : 'finished');
    }

    repeatFunctionType(val) {
        return val === 'continue';
    }

    get retrieveRepeats(): number {
        return this.retrieveRepeat;
    }
}

describe('Poll checker tests', () => {

    const INIT_DELAY = 0;
    const REPEAT_DELAY = 0;

    it('with marbles', () => {
        let pollTest = new PollTest(3);
        let expected = cold('-c', <PollCheckerResult>{
            status: PollCheckerStatus.SUCCESS,
            result: 'finished'
        });
        let poll = pollChecker(pollTest.retrieveFunctionType.bind(pollTest), pollTest.repeatFunctionType.bind(pollTest), INIT_DELAY, REPEAT_DELAY, 5);

        expect(poll).toBeObservable(expected);
    });

    it('should poll with success after 3 fetches', () => {
        let pollTest = new PollTest(3);
        // let expected = cold('-c', {c: PollCheckerResult.SUCCESS});
        let poll = pollChecker(pollTest.retrieveFunctionType.bind(pollTest), pollTest.repeatFunctionType.bind(pollTest), INIT_DELAY, REPEAT_DELAY, 5);

        Observable.of('start')
            .mergeMap(() => poll)
            .subscribe(
                val => {
                    expect(val).toEqual(<PollCheckerResult>{
                        status: PollCheckerStatus.SUCCESS,
                        result: 'finished'
                    });
                },
                () => fail('Should succeed'),
                () => {
                    expect(pollTest.retrieveRepeats).toEqual(3);
                }
            );

        // expect(poll).toBeObservable(expected);
    });

    it('should poll with success witx max attemps', () => {
        let pollTest = new PollTest(5);
        let poll = pollChecker(pollTest.retrieveFunctionType.bind(pollTest), pollTest.repeatFunctionType.bind(pollTest), INIT_DELAY, REPEAT_DELAY, 5);

        Observable.of('start')
            .mergeMap(() => poll)
            .subscribe(
                val => {
                    expect(val).toEqual(<PollCheckerResult>{
                        status: PollCheckerStatus.SUCCESS,
                        result: 'finished'
                    });
                },
                () => fail('Should succeed'),
                () => {
                    expect(pollTest.retrieveRepeats).toEqual(5);
                }
            );
    });

    it('should poll without success with max attempts', () => {
        let pollTest = new PollTest(10);
        let poll = pollChecker(pollTest.retrieveFunctionType.bind(pollTest), pollTest.repeatFunctionType.bind(pollTest), INIT_DELAY, REPEAT_DELAY, 3);

        Observable.of('start')
            .mergeMap(() => poll)
            .subscribe(
                val => {
                    expect(val).toEqual(<PollCheckerResult>{
                        status: PollCheckerStatus.REACHED_MAX_ATTEMPTS,
                        result: 'continue'
                    });
                },
                () => fail('Should succeed'),
                () => {
                    expect(pollTest.retrieveRepeats).toEqual(3);
                }
            );
    });

});
