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
  DomainResponse,
  GetShareProV1OpenapiDingtalkCallbackParams,
  GetShareProV1OpenapiFeishuCallbackParams,
  GithubComChaitinPandaWikiProApiShareV1DingtalkCallbackResp,
  GithubComChaitinPandaWikiProApiShareV1FeishuCallbackResp,
} from "./types";

/**
 * @description dingtalk回调
 *
 * @tags ShareOpenapi
 * @name GetShareProV1OpenapiDingtalkCallback
 * @summary dingtalk回调
 * @request GET:/share/pro/v1/openapi/dingtalk/callback
 * @response `200` `(DomainResponse & {
    data?: GithubComChaitinPandaWikiProApiShareV1DingtalkCallbackResp,

})` OK
 */

export const getShareProV1OpenapiDingtalkCallback = (
  query: GetShareProV1OpenapiDingtalkCallbackParams,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainResponse & {
      data?: GithubComChaitinPandaWikiProApiShareV1DingtalkCallbackResp;
    }
  >({
    path: `/share/pro/v1/openapi/dingtalk/callback`,
    method: "GET",
    query: query,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description feishu回调
 *
 * @tags ShareOpenapi
 * @name GetShareProV1OpenapiFeishuCallback
 * @summary feishu回调
 * @request GET:/share/pro/v1/openapi/feishu/callback
 * @response `200` `(DomainResponse & {
    data?: GithubComChaitinPandaWikiProApiShareV1FeishuCallbackResp,

})` OK
 */

export const getShareProV1OpenapiFeishuCallback = (
  query: GetShareProV1OpenapiFeishuCallbackParams,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainResponse & {
      data?: GithubComChaitinPandaWikiProApiShareV1FeishuCallbackResp;
    }
  >({
    path: `/share/pro/v1/openapi/feishu/callback`,
    method: "GET",
    query: query,
    type: ContentType.Json,
    format: "json",
    ...params,
  });
