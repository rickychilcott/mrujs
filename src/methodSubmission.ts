import { urlEncodeFormData } from './utils/form'
import { findResponseTypeHeader } from './utils/headers'
import { FetchRequest } from './http/fetchRequest'
import { FetchRequestInterface } from '../types'
import { expandUrl, isGetRequest } from './utils/url'

export interface MethodSubmissionInterface {
  request: Request
  fetchRequest: FetchRequestInterface
}

/**
 * This class handles data-method / data-remote submissions (<a data-remote"true">)
  */
export function MethodSubmission (element: HTMLElement): MethodSubmissionInterface {
  const method = getElementMethod(element)
  let maskedMethod

  if (window.mrujs.config.maskLinkMethods) {
    maskedMethod = getMaskedMethod(method)
  }

  const href = element.getAttribute('href') ?? element.dataset.url

  if (href == null) {
    throw Error(`No 'href' or 'data-url' found on ${JSON.stringify(element)}`)
  }

  const url = expandUrl(href)

  const options: RequestInit = {
    headers: getHeaders(element)
  }

  options.method = maskedMethod ?? method
  if (!isGetRequest(method)) options.body = getBody(method, element.getAttribute('data-params'))

  const fetchRequest = FetchRequest(url, options)

  return {
    request: fetchRequest.request,
    fetchRequest
  }
}

/**
 * Headers to send to the request object
 */
function getHeaders (element: HTMLElement | undefined): Headers {
  let responseType

  if (element != null) {
    responseType = element.dataset.type
  }

  const acceptHeader = findResponseTypeHeader(responseType)

  const headers = new Headers({ Accept: acceptHeader })

  headers.set('Accept', acceptHeader)

  return headers
}

/**
  * Returns properly built FormData
  */
function getFormData (method: string): FormData {
  const formData = new FormData()

  if (window.mrujs.config.maskLinkMethods) {
    formData.append('_method', method)
  }

  return formData
}

/**
  * Finds how to send the fetch request
  * get, post, put, patch, etc
  */
function getElementMethod (element: HTMLElement): string {
  const method = element.dataset.method ?? 'get'
  return method.toLowerCase()
}

/**
  * If its a get request, leave it, everything else is masked as a POST.
  */
function getMaskedMethod (method: string): string {
  return isGetRequest(method) ? 'get' : 'post'
}

function getBody (method: string, additionalParams?: string | null): URLSearchParams {
  const encodedFormData = urlEncodeFormData(getFormData(method))

  if (additionalParams == null) return encodedFormData

  const parsedParams = JSON.parse(additionalParams)
  for (const [key, value] of Object.entries(parsedParams)) {
    // @ts-expect-error
    const val = value.toString()

    // Only strings can be added to UrlSearchParams
    const isString = (val instanceof String || typeof val === 'string')
    if (!isString) continue

    encodedFormData.append(key, val)
  }

  return encodedFormData
}
