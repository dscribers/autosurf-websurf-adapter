import BaseAdapter from '@dscribers/autosurf/dist/base-adapter'
import Surfer from './Surfer'

export default class WebSurf extends BaseAdapter {
  #cacheBreakerWrapper = '__RNR__'
  #cacheBreaker = null
  #notify = () => {}

  constructor () {
    super()

    this.#cacheBreaker = this.#cacheBreakerWrapper + Date.now() + this.#cacheBreakerWrapper
  }

  #blur = () => { }

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
    const regExp = new RegExp(`(\?|\&)${this.#cacheBreakerWrapper}.*${this.#cacheBreakerWrapper}/`)

    const cleanLocationHref = document.location.href.replace(regExp, '')

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
      this.#focus(selector)

      new Surfer(selector).click()
      this.#done(true)
    } else {
      this.#done(false, 'Selector not provided')
    }
  }

  // /**
  //  * @inheritdoc
  //  */
  // doGoBack () {
  //   if (window.history) {
  //     this.#done()
  //     window.history.back()
  //   } else {
  //     this.#done(false, 'Cannot go back. History not supported.')
  //   }
  // }

  /**
   * @inheritdoc
   */
  doGoto (url) {
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

  whenDone (callback = () => {}) {
    this.#notify = callback

    return this
  }

  // /**
  //  * @inheritdoc
  //  */
  // doWait (milliseconds) {
  //   if (milliseconds) {

  //     setTimeout(() => this.#done(true), milliseconds)
  //   } else {
  //     this.#done(false, 'Wait period not provided')
  //   }
  // }

  // /**
  //  * @inheritdoc
  //  */
  // doWaitTillPageLoads () {
  //   if (this.#isReloaded) {
  //     this.#isReloaded = false
  //     this.#done(true)
  //   } else {
  //     if (this.#waited >= this.#maxLoadWaitTime) {
  //       this.#done(
  //         false,
  //         `No response after ${this.#maxLoadWaitTime / 1000} seconds`
  //       )
  //     }

  //     setTimeout(() => this.doWaitTillPageLoads(), this.#waitPollTime)
  //     this.#waited += this.#waitPollTime
  //   }
  // }

  #checked (status) {
    this.#blur()

    if (!status) {
      return this.#done(false)
    }

    this.#done(true)
  }

  #done (status, errorMessage) {
    this.#blur()

    this.#notify({
      success: status,
      message: errorMessage
    })
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
}
