type HandlerType = {
  next: (request: ObserverRequest) => { status: number };
  error: (error: Error) => { status: number };
  complete: () => void;
};

type ObserverRequest = {
  method: string;
  host: string;
  path: string;
  body?: typeof userMock;
  params: {
    id?: string;
  };
};

class Observer {
  handlers: HandlerType;
  isUnsubscribed: boolean;
  _unsubscribe: Function = () => {};

  constructor(handlers: typeof this.handlers) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: ObserverRequest) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  _subscribe: (obs: Observer) => Function;

  constructor(subscribe: (obs: Observer) => Function) {
    this._subscribe = subscribe;
  }

  static from(values: ObserverRequest[]) {
    return new Observable((observer: Observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: HandlerType) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const HTTP_POST_METHOD = "POST";
const HTTP_GET_METHOD = "GET";

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const userMock = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: ObserverRequest[] = [
  {
    method: HTTP_POST_METHOD,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (request: ObserverRequest) => {
  // handling of request
  return { status: HTTP_STATUS_OK };
};

const handleError = (error: Error) => {
  // handling of error
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = () => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
