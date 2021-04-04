import BaseAdapter from '@dscribers/autosurf/dist/base-adapter'
import Surfer from './Surfer'

export default class WebSurf extends BaseAdapter {
  #storeName = location.origin + '_atsrf'
  #shouldBackup = false
  #isReloaded = false

  #maxLoadWaitTime = 30000 // 30 seconds
  #waitPollTime = 500
  #waited = 0

  #blur = () => { }

  #errorCallback = () => { }
  #successCallback = () => { }

  /**
   * @inheritdoc
   */
  checkAttrContains (selector, attr, text) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).attr(attr).indexOf(text) !== -1)
  }

  /**
   * @inheritdoc
   */
  checkAttrIs (selector, attr, val) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).attr(attr) == val)
  }

  /**
   * @inheritdoc
   */
  checkExists (selector) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).length > 0)
  }

  /**
   * @inheritdoc
   */
  checkIsOn (url) {
    this.#checked(document.location.href === url.toLowerCase())
  }

  /**
   * Checks if an element is visible or hidden
   *
   * @param {string} selector The selector of the target html element
   * @param {string} display visible | hidden
   */
  checkElementIs (selector, display) {
    this.#focus(selector)

    display = display === 'visible'

    let valid = false
    const item = new Surfer(selector).item

    if (item) {
      if (display) {
        valid = item.style.display !== 'hidden'
      } else {
        valid = item.style.display === 'hidden'
      }
    }

    this.#checked(valid)
  }

  /**
   * @inheritdoc
   */
  checkTextContains (selector, text) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).text().indexOf(text) !== -1)
  }

  /**
   * @inheritdoc
   */
  checkTextIs (selector, text) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).text() === text)
  }

  /**
   * @inheritdoc
   */
  checkValueContains (selector, text) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).value().indexOf(text) !== -1)
  }

  /**
   * @inheritdoc
   */
  checkValueIs (selector, value) {
    this.#focus(selector)
    this.#checked(new Surfer(selector).value() === value)
  }

  /**
   * @inheritdoc
   */
  doClick (selector) {
    if (selector) {
      this.#focus(selector)

      new Surfer(selector).click()
      this.#done(true)
    } else {
      this.#done(false, 'Selector not provided')
    }
  }

  /**
   * @inheritdoc
   */
  doGoBack () {
    if (window.history) {
      this.#done()
      window.history.back()
    } else {
      this.#done(false, 'Cannot go back. History not supported.')
    }
  }

  /**
   * @inheritdoc
   */
  doGoto (url) {
    this.#done()
    setTimeout(() => (location.href = url))
  }

  /**
   * @inheritdoc
   */
  doRefresh () {
    this.#done()
    location.reload()
  }

  /**
   * @inheritdoc
   */
  doSelect (selector, value) {
    if (selector) {
      this.#focus(selector)

      const item = new Surfer(selector)

      item.value(value)
    } else {
      this.#done(false, 'Selector not provided')
    }
  }

  /**
   * @inheritdoc
   */
  doSubmitForm (selector) {
    if (selector) {
      this.#focus(selector)

      new Surfer(selector).item.submit()
      this.#done(true)
    } else {
      this.#done(false, 'Selector not provided')
    }
  }

  /**
   * @inheritdoc
   */
  doType (selector, str, speed = 100) {
    if (selector) {
      this.#focus(selector)

      const item = new Surfer(selector)

      item.value('')

      let index = 0

      const type = () => {
        item.value(item.value() + str[index])

        if (++index < str.length) {
          setTimeout(type, speed)
        } else {
          this.#done(true)
        }
      }

      type()
    } else {
      this.#done(false, 'Selector not provided')
    }
  }

  /**
   * @inheritdoc
   */
  doWait (milliseconds) {
    if (milliseconds) {
      setTimeout(() => this.#done(true), milliseconds)
    } else {
      this.#done(false, 'Wait period not provided')
    }
  }

  /**
   * @inheritdoc
   */
  doWaitTillPageLoads () {
    if (this.#isReloaded) {
      this.#isReloaded = false
      this.#done(true)
    } else {
      if (this.#waited >= this.#maxLoadWaitTime) {
        this.#done(
          false,
          `No response after ${this.#maxLoadWaitTime / 1000} seconds`
        )
      }

      setTimeout(() => this.doWaitTillPageLoads(), this.#waitPollTime)
      this.#waited += this.#waitPollTime
    }
  }

  /**
   * @inheritdoc
   */
  init ($autosurf, callback = () => { }) {
    let loaded = false

    const load = () => {
      if (loaded) {
        return
      }

      loaded = true

      let stored = localStorage.getItem(this.#storeName)

      if (stored) {
        try {
          stored = JSON.parse(stored)

          localStorage.removeItem(this.#storeName)

          this.#isReloaded = true
        } catch (e) {
          stored = undefined
        }
      }

      callback(stored)
    }

    if (document.readyState === 'complete') {
      load()
    } else {
      const oldLoadFunc = window.onload

      window.onload = () => {
        if (typeof oldLoadFunc === 'function') {
          oldLoadFunc()
        }

        load()
      }
    }

    const oldBeforeUnloadFunc = window.onbeforeunload

    window.onbeforeunload = () => {
      if (typeof oldBeforeUnloadFunc === 'function') {
        oldBeforeUnloadFunc()
      }

      this.#backup($autosurf)
    }


  }

  /**
   * @inheritdoc
   */
  quit ($autosurf) {
    this.#needsBackup(false)
    this.#clearBackup()
  }

  /**
   * Sets the function to call when an action fails
   * @param {Function} callback
   */
  setErrorCallback (callback) {
    this.#errorCallback = callback
  }

  /**
   * Sets the function to call when an action was performed successfully
   * @param {Function} callback
   */
  setSuccessCallback (callback) {
    this.#successCallback = callback
  }

  #backup ($autosurf) {
    if (this.#shouldBackup) {
      localStorage.setItem(
        this.#storeName,
        JSON.stringify($autosurf.getBackupData())
      )
    }
  }

  #checked (status) {
    this.#blur()

    if (!status) {
      return this.#done(false)
    }

    this.#done(true)
  }

  #clearBackup () {
    localStorage.removeItem(this.#storeName)
  }

  #done (status, errorMessage) {
    this.#needsBackup(true)

    this.#blur()

    if (typeof status === 'boolean') {
      setTimeout(
        status ? this.#successCallback : this.#errorCallback,
        0,
        errorMessage
      )
    }
  }

  /**
   * Focuses on the current item
   *
   * @param {*} selector The selector of the target html element
   */
  #focus (selector) {
    if (!selector) {
      throw new Error('Selector not provided')
    }

    const item = new Surfer(selector).item

    const focusData = {
      backgroundColor: item.style.backgroundColor,
      border: item.style.border,
      color: item.style.color,
    }

    this.#blur = () => {
      for (let key in focusData) {
        item.style[key] = focusData[key]
      }
    }

    item.style.border = '2px solid magenta'
    item.style.color = '#0e90d2'
    item.style.backgroundColor = '#ffffff'
    item.scrollIntoView({ behavior: 'smooth', block: 'center' })
    item.focus({ preventScroll: true })
  }

  #needsBackup (status) {
    this.#shouldBackup = status
  }
}
