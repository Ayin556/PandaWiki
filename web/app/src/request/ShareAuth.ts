/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import httpRequest, { ContentType, RequestParams } from "./httpClient";
import {
  DomainAuthGetResp,
  DomainAuthLoginSimpleReq,
  DomainResponse,
} from "./types";

/**
 * @description AuthGet
 *
 * @tags share_auth
 * @name GetShareV1AuthGet
 * @summary AuthGet
 * @request GET:/share/v1/auth/get
 * @response `200` `(DomainResponse & {
    data?: DomainAuthGetResp,

})` OK
 */

export const getShareV1AuthGet = (params: RequestParams = {}) =>
  httpRequest<
    DomainResponse & {
      data?: DomainAuthGetResp;
    }
  >({
    path: `/share/v1/auth/get`,
    method: "GET",
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description AuthLoginSimple
 *
 * @tags share_auth
 * @name PostShareV1AuthLoginSimple
 * @summary AuthLoginSimple
 * @request POST:/share/v1/auth/login/simple
 * @response `200` `DomainResponse` OK
 */

export const postShareV1AuthLoginSimple = (
  param: DomainAuthLoginSimpleReq,
  params: RequestParams = {},
) =>
  httpRequest<DomainResponse>({
    path: `/share/v1/auth/login/simple`,
    method: "POST",
    body: param,
    type: ContentType.Json,
    format: "json",
    ...params,
  });
