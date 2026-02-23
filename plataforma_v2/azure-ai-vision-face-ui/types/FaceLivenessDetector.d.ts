/**
 * Final results from face analysis.
 */
export interface LivenessDetectionSuccess {
  /**
   * Result ID.
   */
  readonly resultId: string;
  /**
   * We highly recommend leveraging the "digest" generated within the solution to validate the integrity of the communication between your application and the Azure AI Vision Face service. This is necessary to ensure that the final liveness detection result is trustworthy.
   * The "digest" will be contained within the liveness detection result when calling the detectLiveness-sessions/<session-id> REST call. Look for an example of the "digest" in the [tutorial](https://aka.ms/azure-ai-vision-face-liveness-tutorial) where the liveness detection result is shown.
   * Digests must match between the application and the service.
   */
  readonly digest: string;
}

/**
 * Reason of liveness detection failure.
 * @readonly
 */
export enum LivenessError {
    /** Liveness has not failed. */
    None = "None",
    /** The operation took longer than the time limit. */
    TimedOut = "TimedOut",
    /** Invalid token. */
    InvalidToken = "InvalidToken",
    /** Camera permission issue. */
    CameraPermissionDenied = "CameraPermissionDenied",
    /** Other camera issues. */
    CameraStartupFailure = "CameraStartupFailure",    
    /** No face detected. */
    NoFaceDetected = "NoFaceDetected",    
    /** Tracking failure */
    FaceTrackingFailed = "FaceTrackingFailed",
    /** User did not smile during Active check. */
    SmileNotPerformed = "SmileNotPerformed",
    /** User did not perform the required head movements. */
    HeadTurnNotPerformed = "HeadTurnNotPerformed",
    /** API request timed out. */
    ServerRequestTimedOut = "ServerRequestTimedOut",
    /** Mouth region of the face was not visible.  */
    FaceMouthRegionNotVisible = "FaceMouthRegionNotVisible",
    /** Eye region of the face was not visible. */
    FaceEyeRegionNotVisible = "FaceEyeRegionNotVisible",
    /** Image was too blurry. */
    ExcessiveImageBlurDetected = "ExcessiveImageBlurDetected",
    /** Face was too brightly and unevenly illuminated. */
    ExcessiveFaceBrightness = "ExcessiveFaceBrightness",
    /** A mask was blocking the view of the face. */
    FaceWithMaskDetected = "FaceWithMaskDetected",
    /** Lighting condition during operation is not supported by current liveness detection mode. */
    EnvironmentNotSupported = "EnvironmentNotSupported",
    /** User canceled session */
    UserCanceledSession = "UserCanceledSession",
    /** User canceled active motion */
    UserCanceledActiveMotion = "UserCanceledActiveMotion",
    /** User canceled active motion prompt */
    UserCanceledActiveMotionPrompt = "UserCanceledActiveMotionPrompt",
    /** Unexpected client error. */
    UnexpectedClientError = "UnexpectedClientError",
    /** Unexpected server error. */
    UnexpectedServerError = "UnexpectedServerError",
    /** Client version not supported error. */
    ClientVersionNotSupported = "ClientVersionNotSupported",
    /** Verification image not provided error. */
    VerifyImageNotProvided = "VerifyImageNotProvided",
    /** Unexpected generic error. */
    Unexpected = "Unexpected"    
}

/**
 * Reason for recognition failure.
 * @readonly
 */
export enum RecognitionError {
    /** Recognition has not failed. */
    None = "None",
    /** Failure did not fall into any of the other categories. */
    GenericFailure = "GenericFailure",
    /** Face was looking away. */
    FaceNotFrontal = "FaceNotFrontal",
    /** Eye region of the face was not visible. */
    FaceEyeRegionNotVisible = "FaceEyeRegionNotVisible",
    /** Face was too brightly and unevenly illuminated. */
    ExcessiveFaceBrightness = "ExcessiveFaceBrightness",
    /** Image was too blurry. */
    ExcessiveImageBlurDetected = "ExcessiveImageBlurDetected",
    /** Face was not found in verify image */
    FaceNotFound = "FaceNotFound",
    /** Multiple face found in verify image */
    MultipleFaceFound = "MultipleFaceFound",
    /** Verify image has content decoding error */
    ContentDecodingError = "ContentDecodingError",
    /** Image size was too large */
    ImageSizeIsTooLarge = "ImageSizeIsTooLarge",
    /** Image size was too small */
    ImageSizeIsTooSmall = "ImageSizeIsTooSmall",
    /** Image had unsupported media type */
    UnsupportedMediaType = "UnsupportedMediaType",
    /** Mouth region of the face was not visible. */
    FaceMouthRegionNotVisible = "FaceMouthRegionNotVisible",
    /** Face with mask was detected. */
    FaceWithMaskDetected = "FaceWithMaskDetected",
}

/**
 * Failure results from face analysis.
 */
export interface LivenessDetectionError {
    /**
     * Reason for liveness detection failure.
     */
    readonly livenessError: LivenessError;
 
    /**
     * Reason for recognition failure.
     */
    readonly recognitionError: RecognitionError;
 }

/**
 * FaceLivenessDetector web component module.
 * @module FaceLivenessDetector
 * @exports FaceLivenessDetector
 * @extends HTMLElement
 */
export class FaceLivenessDetector extends HTMLElement {

  /**
   * Start the session for liveness.
   * @param {string} sessionAuthorizationToken - The token value.
   */
  start(sessionAuthorizationToken: string): Promise<LivenessDetectionSuccess>;

  /**
   * Set the locale to use for the session by using IETF BCP 47.
   * The default locale en.
   * Supported locales are en, pt, fa.
   * For other languages use the language property to set the dictionary.
   */
  locale : string;

  /**
   * Set the language property to set a new language dictionary.
   */
  languageDictionary : string;

  /**
   * Set the mediaInfoDeviceId to override the default camera used for face analysis. 
   * 
   */
  mediaInfoDeviceId : string;

  /**
   * Customize the default "Increase your screen brightness" image by providing your own image.
   */
  brightnessImagePath : string;

  /**
   * Customize the default font size for all the text.
   */
  fontSize : string;

  /**
   * Customize the default font family for all the text.
   */
  fontFamily : string;

  /**
   * Customize the default CSS styles for buttons.
   */
  buttonStyles : string;

  /**
   * Customize the default CSS styles for feedback messages.
   */
  feedbackMessageStyles : string;

  /**
   * Customize the session to skip the instructions for active motion part of the session.
   */
  skipInstructions : boolean;
}