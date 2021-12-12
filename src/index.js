import BaseAdapter from '@dscribers/autosurf/dist/base-adapter'
import Surfer from './Surfer'

export default class WebSurf extends BaseAdapter {
  #storeName = location.origin + '_atsrf'
  #shouldBackup = false
  #isReloaded = false

  #maxLoadWaitTime = 30000 // 30 seconds
  #waitPollTime = 500
  #waited = 0

  #cacheBreakerWrapper = '__RNR__'
  #cacheBreaker = null

  constructor() {
    super()

    this.#cacheBreaker = this.#cacheBreakerWrapper + Date.now() + this.#cacheBreakerWrapper
  }

  #blur = () => { }

  #errorCallback = () => { }
  #successCallback = () => { }

  /**
   * @inheritdoc
   */
  checkAttrContains (selector, attr, text) {
    this.#focus(selector)

    const it = new Surfer(selector).attr(attr) || ''
    this.#checked(it.includes(text))
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
    const cleanLocationHref = document.location.href.replace(/(\?|\&)__RNR__.*__RNR__/, '')

    this.#checked(cleanLocationHref === url)
  }

  /**
   * Checks if an element is visible or hidden
   *
   * @param {string} selector The selector of the target html element
   * @param {string} display visible | hidden
   */
  checkElementIs (selector, display) {
    this.#focus(selector)

    const visible = display === 'visible'
    const isVisible = (elem) => {
      if (window.getComputedStyle(elem).display === 'none') {
        return false
      } else if (!elem.parentElement) {
        return true
      }

      return isVisible(elem.parentElement)
    }

    let valid = false
    const item = new Surfer(selector).item

    if (item) {
      if (visible) {
        valid = isVisible(item)
      } else {
        valid = !isVisible(item)
      }
    }

    this.#checked(valid)
  }

  checkPageContains (selector, text) {
    const body = new Surfer(selector)

    let contains = body.text().includes(text)

    if (!contains) {
      body.find('input, textarea, select').each(item => {
        contains = `${(item.value || '')}`.includes(text)

        if (contains) {
          return false
        }
      })
    }

    this.#checked(contains)
  }

  /**
   * @inheritdoc
   */
  checkTextContains (selector, text) {
    this.#focus(selector)

    const item = new Surfer(selector).text() || ''
    this.#checked(item.includes(text))
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

    const item = `${new Surfer(selector).value() || ''}`
    this.#checked(item.includes(text))
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
      this.#needsBackup(true)
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
      this.#needsBackup(true)
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
    this.#needsBackup(true)
    this.#done()

    setTimeout(() => {
      const urlWithoutHash = url.split('#')[0]
      const locationWithHash = location.href.split('#')[0]

      const joiner = url.includes('?') ? '&' : '?'

      // disable assets caching
      location.href = url + joiner + this.#cacheBreaker

      if (urlWithoutHash === locationWithHash) {
        location.reload()
      }
    })
  }

  /**
   * @inheritdoc
   */
  doRefresh () {
    this.#needsBackup(true)
    this.#done()
    location.reload()
  }

  /**
   * @inheritdoc
   */
  doSelect (selector, value) {
    if (selector) {
      this.#needsBackup(true)
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
      this.#needsBackup(true)
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
      this.#needsBackup(true)
      this.#focus(selector)

      const item = new Surfer(selector)

      item.value('')

      let index = 0

      const type = () => {
        item.value(item.value() + str[index])
        item.dispatchEvent('input')

        if (++index < str.length) {
          setTimeout(type, speed)
        } else {
          item.blur()
          item.dispatchEvent('change')
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
      this.#needsBackup(true)

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
      this.#needsBackup(true)
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

    if (!item) {
      throw new Error(`Element not found`)
    }

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
