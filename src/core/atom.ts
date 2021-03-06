import {
    IDerivationState,
    IObservable,
    createInstanceofPredicate,
    endBatch,
    getNextId,
    noop,
    onBecomeObserved,
    onBecomeUnobserved,
    propagateChanged,
    reportObserved,
    startBatch,
    isSpyEnabled,
    spyReport
} from "../internal"

export const $mobx = Symbol("mobx administration")

export interface IAtom extends IObservable {
    reportObserved()
    reportChanged()
}

export class Atom implements IAtom {
    isPendingUnobservation = false // for effective unobserving. BaseAtom has true, for extra optimization, so its onBecomeUnobserved never gets called, because it's not needed
    isBeingObserved = false
    observers = new Set()

    diffValue = 0
    lastAccessedBy = 0
    lowestObserverState = IDerivationState.NOT_TRACKING
    /**
     * Create a new atom. For debugging purposes it is recommended to give it a name.
     * The onBecomeObserved and onBecomeUnobserved callbacks can be used for resource management.
     */
    constructor(public name = "Atom@" + getNextId()) {
        if (isSpyEnabled() && process.env.NODE_ENV !== "production") {
            // only notify spy if this is a stand-alone observable
            spyReport({ type: "createAtom", atom: this, name: this.name })
        }
    }

    public onBecomeUnobserved() {
        // noop
    }

    public onBecomeObserved() {
        /* noop */
    }

    /**
     * Invoke this method to notify mobx that your atom has been used somehow.
     * Returns true if there is currently a reactive context.
     */
    public reportObserved(): boolean {
        return reportObserved(this)
    }

    /**
     * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
     */
    public reportChanged() {
        startBatch()
        propagateChanged(this)
        endBatch()
    }

    toString() {
        return this.name
    }
}

export const isAtom = createInstanceofPredicate("Atom", Atom)

export function createAtom(
    name: string,
    onBecomeObservedHandler: () => void = noop,
    onBecomeUnobservedHandler: () => void = noop
): IAtom {
    const atom = new Atom(name)
    onBecomeObserved(atom, onBecomeObservedHandler)
    onBecomeUnobserved(atom, onBecomeUnobservedHandler)
    return atom
}
